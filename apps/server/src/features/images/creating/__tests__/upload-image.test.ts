import { describe, expect, test } from "bun:test";

import { PHOTO_MAX_BYTES } from "@analemma/contract";

import { detectImageFormat } from "@/platform/images/detect-image-format";
import {
  catchErrorCode,
  createTestClient,
  signInAsAdmin,
  TEST_NOW,
  TEST_ORIGIN,
  type TestClient,
} from "@/test-client";

const FIXTURES = {
  "wide-red.jpg": "../../processing/__tests__/wide-red.jpg",
  "high-iso.jpg": "../../processing/__tests__/high-iso.jpg",
  "red.bmp": "../../processing/__tests__/red.bmp",
  "rotated-with-gps.heic":
    "../../../../platform/images/__tests__/rotated-with-gps.heic",
};

const photo = async (name: keyof typeof FIXTURES, type = "") => {
  const response = await fetch(new URL(FIXTURES[name], import.meta.url));

  return new File([await response.arrayBuffer()], name, { type });
};

const MEGABYTE = 1024 * 1024;

/** テストで送る、写真の本文の大きさと Cookie。 */
type UploadBody = {
  /** 本文の bytes の数。 */
  readonly size: number;
  /** Content-Length に書く値(省くと本文の大きさ)。 */
  readonly contentLength?: number;
  /** ログインしたブラウザの Cookie を付けるか。 */
  readonly cookie: boolean;
};

const uploadRequest = (
  server: TestClient,
  { size, contentLength = size, cookie }: UploadBody,
): Request =>
  new Request(`${TEST_ORIGIN}/api/admin/images/upload`, {
    method: "POST",
    headers: {
      origin: TEST_ORIGIN,
      "sec-fetch-site": "same-origin",
      "content-type": "multipart/form-data; boundary=photo",
      "content-length": String(contentLength),
      ...(cookie && { cookie: server.cookie() }),
    },
    body: new Uint8Array(size),
  });

describe("写真を送って画像を作る", () => {
  test("JPEG から、撮影の情報と配信用の画像を持つ公開の画像を作り、一覧の先頭に出すこと", async () => {
    await using server = await createTestClient();
    await signInAsAdmin(server);

    const image = await server.client.admin.images.upload({
      photo: await photo("high-iso.jpg", "image/jpeg"),
    });

    expect(image).toMatchObject({
      title: null,
      description: null,
      alt: null,
      iso: 102_400,
      published: true,
      publishedAt: TEST_NOW.toISOString(),
    });
    expect((await server.client.admin.images.list({})).images).toEqual([image]);
  });

  test("幅の段ごとの AVIF を作り、配信すること", async () => {
    await using server = await createTestClient();
    await signInAsAdmin(server);

    const image = await server.client.admin.images.upload({
      photo: await photo("wide-red.jpg", "image/jpeg"),
    });

    expect(image.deliveryImages.map(({ width }) => width)).toEqual([
      640, 1280, 1920, 2560,
    ]);

    const formats = await Promise.all(
      image.deliveryImages.map(async ({ url }) => {
        const response = await server.app.request(url);
        expect(response.status).toBe(200);

        return detectImageFormat(new Uint8Array(await response.arrayBuffer()));
      }),
    );

    expect(formats).toEqual(["avif", "avif", "avif", "avif"]);
  });

  test("HEIC を、ファイルの種類が空でも中身で見分け、表示の向きの大きさで登録すること", async () => {
    await using server = await createTestClient();
    await signInAsAdmin(server);

    const image = await server.client.admin.images.upload({
      photo: await photo("rotated-with-gps.heic"),
    });

    expect(image).toMatchObject({
      takenAt: "2025-05-01T14:03:27",
      takenAtOffset: "+09:00",
      deliveryImages: [{ width: 64, height: 96 }],
    });
  });

  test("受けない形式の写真は UNSUPPORTED_FORMAT で断り、画像を作らないこと", async () => {
    await using server = await createTestClient();
    await signInAsAdmin(server);

    expect(
      await catchErrorCode(
        server.client.admin.images.upload({
          photo: await photo("red.bmp", "image/jpeg"),
        }),
      ),
    ).toBe("UNSUPPORTED_FORMAT");
    expect((await server.client.admin.images.list({})).images).toEqual([]);
  });

  test("同時に送った2枚の写真を、どちらも画像にすること", async () => {
    await using server = await createTestClient();
    await signInAsAdmin(server);

    const images = await Promise.all([
      server.client.admin.images.upload({
        photo: await photo("high-iso.jpg"),
      }),
      server.client.admin.images.upload({
        photo: await photo("rotated-with-gps.heic"),
      }),
    ]);

    const listed = (await server.client.admin.images.list({})).images;

    expect(listed.map(({ id }) => id).toSorted()).toEqual(
      images.map(({ id }) => id).toSorted(),
    );
  });
});

describe("写真を送る本文の大きさ", () => {
  test("セッションが無いと、ほかの API と同じ 1 MB を超える本文を 413 で断ること", async () => {
    await using server = await createTestClient();

    const response = await server.app.fetch(
      uploadRequest(server, { size: 2 * MEGABYTE, cookie: false }),
    );

    expect(response.status).toBe(413);
  });

  test("ログイン中なら 1 MB を超える写真も受け、中身の形式を確かめること", async () => {
    await using server = await createTestClient();
    await signInAsAdmin(server);

    const large = new File([new Uint8Array(2 * MEGABYTE)], "large.jpg");

    expect(
      await catchErrorCode(server.client.admin.images.upload({ photo: large })),
    ).toBe("UNSUPPORTED_FORMAT");
  });

  test("ログイン中でも、写真の上限にほかの API の上限を足した大きさを超える本文は、読まずに 413 で断ること", async () => {
    await using server = await createTestClient();
    await signInAsAdmin(server);

    const response = await server.app.fetch(
      uploadRequest(server, {
        size: 16,
        contentLength: PHOTO_MAX_BYTES + MEGABYTE + 1,
        cookie: true,
      }),
    );

    expect(response.status).toBe(413);
  });
});
