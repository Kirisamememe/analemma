import { describe, expect, test } from "bun:test";

import { detectImageFormat } from "@/platform/images/detect-image-format";
import {
  catchErrorCode,
  createTestClient,
  holdFirstConversion,
  photo,
  signInAsAdmin,
  TEST_NOW,
  type TestClient,
} from "@/test-client";

const converted = async (server: TestClient, id: string) => {
  await server.pending.settle();

  return server.client.admin.images.get({ id });
};

describe("写真を受け取る", () => {
  test("JPEG を受け取ると、撮影の情報を持つ変換中の画像を返し、変換を終えると公開にして一覧の先頭に出すこと", async () => {
    await using server = await createTestClient();
    await signInAsAdmin(server);

    const received = await server.client.admin.images.upload({
      photo: await photo("high-iso.jpg", "image/jpeg"),
    });

    expect(received).toMatchObject({
      title: null,
      description: null,
      alt: null,
      iso: 102_400,
      status: "processing",
      publishedAt: null,
      deliveryImages: [],
    });

    const image = await converted(server, received.id);

    expect(image).toMatchObject({
      iso: 102_400,
      status: "published",
      publishedAt: TEST_NOW.toISOString(),
    });
    expect((await server.client.admin.images.list({})).images).toEqual([image]);
  });

  test("幅の段ごとの AVIF を作り、配信すること", async () => {
    await using server = await createTestClient();
    await signInAsAdmin(server);

    const { id } = await server.client.admin.images.upload({
      photo: await photo("wide-red.jpg", "image/jpeg"),
    });

    const image = await converted(server, id);

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

    const received = await server.client.admin.images.upload({
      photo: await photo("rotated-with-gps.heic"),
    });

    expect(received).toMatchObject({
      takenAt: "2025-05-01T14:03:27",
      takenAtOffset: "+09:00",
    });
    expect(await converted(server, received.id)).toMatchObject({
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
});

describe("受け取った写真の変換", () => {
  test("変換を待たずに次の写真を受け取り、変換中の画像は公開も非公開もできず、1枚ずつ変換して公開にすること", async () => {
    const held = holdFirstConversion();
    await using server = await createTestClient({
      conversions: held.conversions,
    });
    await signInAsAdmin(server);

    const images = server.client.admin.images;
    const first = await images.upload({ photo: await photo("high-iso.jpg") });
    const second = await images.upload({ photo: await photo("wide-red.jpg") });

    expect(held.converted()).toBe(0);
    expect((await images.list({})).images.map(({ status }) => status)).toEqual([
      "processing",
      "processing",
    ]);
    expect(await catchErrorCode(images.publish({ id: first.id }))).toBe(
      "NOT_CONVERTED",
    );
    expect(await catchErrorCode(images.unpublish({ id: second.id }))).toBe(
      "NOT_CONVERTED",
    );

    held.release();
    await server.pending.settle();

    expect(held.converted()).toBe(2);
    expect((await images.list({})).images.map(({ status }) => status)).toEqual([
      "published",
      "published",
    ]);
    expect(
      await server.storage.read(`pending/${first.id}.bin`),
    ).toBeUndefined();
    expect(server.logs.filter(({ level }) => level === "error")).toEqual([]);
  });

  test("読めずに変換できなかった写真は、読めない写真の状態にし、原本を消して、ログに書くこと", async () => {
    await using server = await createTestClient({
      conversions: {
        run: () => Promise.reject(new Error("壊れた写真")),
      },
    });

    await signInAsAdmin(server);

    const images = server.client.admin.images;
    const { id } = await images.upload({ photo: await photo("high-iso.jpg") });

    expect(await converted(server, id)).toMatchObject({
      status: "unreadable",
      publishedAt: null,
      deliveryImages: [],
    });
    expect(await catchErrorCode(images.publish({ id }))).toBe("NOT_CONVERTED");
    expect(await server.storage.read(`pending/${id}.bin`)).toBeUndefined();
    expect(server.logs.filter(({ level }) => level === "error")).toMatchObject([
      { message: "受け取った写真を変換できなかった" },
    ]);
  });

  test("変換を待つ間に消した画像は、変換の順番が来ても戻さず、原本を残さないこと", async () => {
    const held = holdFirstConversion();
    await using server = await createTestClient({
      conversions: held.conversions,
    });
    await signInAsAdmin(server);

    const images = server.client.admin.images;
    const { id } = await images.upload({ photo: await photo("high-iso.jpg") });

    await images.delete({ id });
    held.release();
    await server.pending.settle();

    expect((await images.list({})).images).toEqual([]);
    expect(await server.storage.read(`pending/${id}.bin`)).toBeUndefined();
    expect(server.logs.filter(({ level }) => level === "error")).toEqual([]);
  });

  test("止まる前に受け取った画像を、起動のときに変換し直し、原本の無い画像は変換を終えられなかった状態にして、画像の無い原本を消すこと", async () => {
    const held = holdFirstConversion();
    await using server = await createTestClient({
      conversions: held.conversions,
    });
    await signInAsAdmin(server);

    const images = server.client.admin.images;
    const kept = await images.upload({ photo: await photo("high-iso.jpg") });
    const lost = await images.upload({ photo: await photo("wide-red.jpg") });

    const orphan = `pending/${crypto.randomUUID()}.bin`;

    await server.storage.remove([`pending/${lost.id}.bin`]);
    await server.storage.write(orphan, new Uint8Array(8));

    const restarting = server.restart();

    held.release();
    await restarting;

    expect(await converted(server, kept.id)).toMatchObject({
      status: "published",
    });
    expect(await images.get({ id: lost.id })).toMatchObject({
      status: "interrupted",
    });
    expect(await server.storage.read(orphan)).toBeUndefined();
  });
});
