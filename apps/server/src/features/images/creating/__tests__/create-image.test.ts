import { describe, expect, spyOn, test } from "bun:test";

import { createImage } from "@/features/images/creating/create-image";
import { createConversionQueue } from "@/features/images/processing/conversion-queue";
import { openDatabase } from "@/platform/database";
import { detectImageFormat } from "@/platform/images/detect-image-format";
import { toTestDatabaseTarget } from "@/platform/test-database/to-test-database-target";
import {
  createTestClient,
  signInAsAdmin,
  TEST_NOW,
  type TestClient,
} from "@/test-client";

const fixture = async (name: string) => {
  const response = await fetch(
    new URL(`../../processing/__tests__/${name}`, import.meta.url),
  );

  return new Uint8Array(await response.arrayBuffer());
};

const connectionTo = (server: TestClient) =>
  openDatabase({
    target: toTestDatabaseTarget(server.databaseName),
    logger: { write: () => undefined },
    max: 1,
  });

const clock = { now: () => TEST_NOW };
const conversions = createConversionQueue();

describe("写真から画像を作る", () => {
  test("初めから公開された写真を管理用 API で取得でき、幅ごとの AVIF が配信されること", async () => {
    await using server = await createTestClient();
    await using connection = connectionTo(server);
    await signInAsAdmin(server);

    const result = await createImage(
      { db: connection.db, clock, conversions, storage: server.storage },
      await fixture("wide-red.jpg"),
    );

    if (result._tag !== "Created") throw new Error(result._tag);

    const image = await server.client.admin.images.get({ id: result.image.id });
    expect(image).toEqual(result.image);
    expect(image).toMatchObject({
      title: null,
      description: null,
      alt: null,
      published: true,
      publishedAt: TEST_NOW.toISOString(),
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

  test("EXIF から取得した ISO 感度を画像に記録すること", async () => {
    await using server = await createTestClient();
    await using connection = connectionTo(server);

    const result = await createImage(
      { db: connection.db, clock, conversions, storage: server.storage },
      await fixture("high-iso.jpg"),
    );

    if (result._tag !== "Created") throw new Error(result._tag);

    await signInAsAdmin(server);
    expect(
      await server.client.admin.images.get({ id: result.image.id }),
    ).toMatchObject({ iso: 102_400 });
  });

  test("対応しない形式を渡すと画像を登録しないこと", async () => {
    await using server = await createTestClient();
    await using connection = connectionTo(server);

    const result = await createImage(
      { db: connection.db, clock, conversions, storage: server.storage },
      new TextEncoder().encode("写真ではありません"),
    );

    expect(result).toEqual({ _tag: "UnsupportedFormat" });
    await signInAsAdmin(server);
    expect((await server.client.admin.images.list({})).images).toEqual([]);
  });

  test("途中までファイルを書いた後に失敗しても、画像の行と書きかけのファイルが残らないこと", async () => {
    await using server = await createTestClient();
    await using connection = connectionTo(server);
    await signInAsAdmin(server);
    const keys: string[] = [];

    const storage = {
      ...server.storage,
      write: async (key: string, bytes: Uint8Array) => {
        keys.push(key);
        await server.storage.write(key, bytes);

        if (keys.length === 2) throw new Error("書き込めません");
      },
    };

    const [failure] = await Promise.allSettled([
      createImage(
        { db: connection.db, clock, conversions, storage },
        await fixture("wide-red.jpg"),
      ),
    ]);

    expect(failure).toMatchObject({
      status: "rejected",
      reason: new Error("書き込めません"),
    });
    expect((await server.client.admin.images.list({})).images).toEqual([]);
    expect(keys).toHaveLength(2);
    expect(
      await Promise.all(keys.map((key) => server.storage.read(key))),
    ).toEqual([undefined, undefined]);
  });
  test.each([
    {
      aborted: true,
      name: "DB の登録が取り消されたときは配信用のファイルを消すこと",
    },
    {
      aborted: false,
      name: "DB の登録が確定していれば、応答を失っても配信用のファイルが残ること",
    },
  ])("$name", async ({ aborted }) => {
    await using server = await createTestClient();
    await using connection = connectionTo(server);
    const db = connection.db;
    const transaction = db.transaction.bind(db);
    spyOn(db, "transaction").mockImplementation(async (register, options) => {
      await transaction(async (tx) => {
        await register(tx);

        if (aborted) tx.rollback();
      }, options);
      throw new Error("確定の応答を受け取れません");
    });
    const written: string[] = [];

    const storage = {
      ...server.storage,
      write: async (fileKey: string, bytes: Uint8Array) => {
        written.push(fileKey);
        await server.storage.write(fileKey, bytes);
      },
    };

    const [result] = await Promise.allSettled([
      createImage(
        { clock, conversions, db, storage },
        await fixture("high-iso.jpg"),
      ),
    ]);

    expect(result.status).toBe("rejected");
    expect(written).toHaveLength(1);
    const [key] = written;

    if (key === undefined) throw new Error("配信用の画像がありません");

    expect((await server.storage.read(key)) !== undefined).toBe(!aborted);
    await signInAsAdmin(server);
    expect((await server.client.admin.images.list({})).images).toHaveLength(
      aborted ? 0 : 1,
    );
  });
});
