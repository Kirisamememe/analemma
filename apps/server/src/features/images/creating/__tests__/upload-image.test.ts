import { describe, expect, test } from "bun:test";

import { detectImageFormat } from "@/platform/images/detect-image-format";
import {
  catchErrorCode,
  createTestClient,
  SUCCEEDED,
  signInAsAdmin,
  TEST_NOW,
} from "@/test-client";
import {
  holdFirstConversion,
  photo,
  uploadRequest,
} from "@/test-client/photo-uploads";

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
      status: "published",
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

  test("HEIC を、MIME type が空でも中身で見分け、表示の向きの大きさで登録すること", async () => {
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

  test("同時に送った写真は1枚ずつ変換し、3枚目は、末尾の / の有無によらず本文を読まずに 503 で断り、空いたら受けること", async () => {
    const held = holdFirstConversion();
    await using server = await createTestClient({
      conversions: held.conversions,
    });
    await signInAsAdmin(server);

    const upload = async () =>
      catchErrorCode(
        server.client.admin.images.upload({
          photo: await photo("high-iso.jpg"),
        }),
      );

    const first = [upload(), upload()];
    await held.queued(2);

    expect(held.converted()).toBe(0);
    expect(await upload()).toBe("SERVICE_UNAVAILABLE");

    for (const path of ["images/upload", "images/upload/"]) {
      const request = uploadRequest(server, { size: 16, cookie: true, path });
      const response = await server.app.fetch(request);

      expect(response.status).toBe(503);
      expect(response.headers.get("retry-after")).toBe("10");
      expect(request.bodyUsed).toBe(false);
    }

    held.release();

    expect(await Promise.all(first)).toEqual([SUCCEEDED, SUCCEEDED]);
    expect(await upload()).toBe(SUCCEEDED);
    expect((await server.client.admin.images.list({})).images).toHaveLength(3);
  });

  test("変換を待つ間に送るのをやめた写真は、画像にせず、枠を空けて、ログに失敗と書かないこと", async () => {
    const held = holdFirstConversion();
    await using server = await createTestClient({
      conversions: held.conversions,
    });
    await signInAsAdmin(server);

    const first = server.client.admin.images.upload({
      photo: await photo("high-iso.jpg"),
    });

    const controller = new AbortController();

    const abandoned = server.client.admin.images.upload(
      { photo: await photo("wide-red.jpg") },
      { signal: controller.signal },
    );

    await held.queued(2);
    controller.abort();
    await Promise.allSettled([abandoned]);

    const next = server.client.admin.images.upload({
      photo: await photo("rotated-with-gps.heic"),
    });

    held.release();

    const images = await Promise.all([first, next]);
    const listed = (await server.client.admin.images.list({})).images;

    expect(listed.map(({ id }) => id).toSorted()).toEqual(
      images.map(({ id }) => id).toSorted(),
    );
    expect(held.converted()).toBe(2);
    expect(server.logs.filter(({ level }) => level === "error")).toEqual([]);
  });

  test("ログイン中に送った写真だけ、変換を待つ間の接続を長く保たせること", async () => {
    const kept: string[] = [];

    await using server = await createTestClient({
      listener: {
        keepAlive: (request) => {
          kept.push(new URL(request.url).pathname);
        },
      },
    });

    await server.app.fetch(uploadRequest(server, { size: 16, cookie: false }));
    expect(kept).toEqual([]);

    await signInAsAdmin(server);
    await server.client.admin.images.upload({
      photo: await photo("high-iso.jpg"),
    });

    expect(kept).toEqual(["/api/admin/images/upload"]);
  });
});
