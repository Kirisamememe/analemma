import { describe, expect, test } from "bun:test";

import type { ConversionQueue } from "@/features/images/processing/conversion-queue";
import {
  catchErrorCode,
  connectTestDropbox,
  createTestClient,
  signInAsAdmin,
  TEST_NOW,
  type TestClient,
} from "@/test-client";

const FIXTURE = new URL(
  "../../../images/processing/__tests__/wide-red.jpg",
  import.meta.url,
);

const readPhoto = async (): Promise<Uint8Array> =>
  new Uint8Array(await (await fetch(FIXTURE)).arrayBuffer());

/** 開くまで変換を始めない、変換のキュー。 */
const gatedConversions = () => {
  const gate = Promise.withResolvers<undefined>();
  const reached = Promise.withResolvers<undefined>();

  const conversions: ConversionQueue = {
    run: async (convert) => {
      reached.resolve(undefined);

      await gate.promise;

      return convert();
    },
  };

  return {
    conversions,
    reached: reached.promise,
    open: () => {
      gate.resolve(undefined);
    },
  };
};

const prepare = async (conversions?: ConversionQueue) => {
  const server = await createTestClient(
    conversions === undefined ? {} : { conversions },
  );

  await signInAsAdmin(server);
  await connectTestDropbox(server);

  return server;
};

const waitForImport = async (server: TestClient) => {
  for (;;) {
    const run = await server.client.admin.dropbox.getImport();

    if (run?.finishedAt !== null) return run;

    await new Promise((resolve) => {
      setTimeout(resolve, 20);
    });
  }
};

describe("App folder の写真の一覧", () => {
  test("取り込める形式の写真だけを、ページをまたいで、新しく変わった順に返すこと", async () => {
    await using server = await prepare();
    const bytes = await readPhoto();
    const older = await server.dropbox.put("/2025/Older.JPG", bytes);

    await server.dropbox.put("/notes.txt", new Uint8Array([1]));
    const newer = await server.dropbox.put("/新しい.heic", new Uint8Array([2]));

    const { photos } = await server.client.admin.dropbox.photos();

    expect(
      photos.map(({ id, path, imported }) => ({ id, path, imported })),
    ).toEqual([
      { id: newer, path: "/新しい.heic", imported: null },
      { id: older, path: "/2025/Older.JPG", imported: null },
    ]);
    expect(photos[1]?.size).toBe(bytes.byteLength);
  });

  test("つないでいなければ断ること", async () => {
    await using server = await createTestClient();
    await signInAsAdmin(server);

    expect(await catchErrorCode(server.client.admin.dropbox.photos())).toBe(
      "NOT_CONNECTED",
    );
  });

  test("利用者が Dropbox の側で切ったら、接続が切れたと返し、接続を消すこと", async () => {
    await using server = await prepare();

    server.dropbox.unlink();

    expect(await catchErrorCode(server.client.admin.dropbox.photos())).toBe(
      "CONNECTION_LOST",
    );
    expect(await server.client.admin.dropbox.get()).toEqual({
      status: "disconnected",
    });
    expect(await catchErrorCode(server.client.admin.dropbox.photos())).toBe(
      "NOT_CONNECTED",
    );
  });
});

describe("取り込み", () => {
  test("選んだ写真を1枚ずつ画像にし、一覧に取り込んだ記録を出すこと", async () => {
    await using server = await prepare();
    const id = await server.dropbox.put("/a.jpg", await readPhoto());

    const started = await server.client.admin.dropbox.startImport({
      ids: [id],
    });

    expect(started).toMatchObject({
      startedAt: TEST_NOW.toISOString(),
      photos: [{ id, path: "/a.jpg" }],
    });

    const run = await waitForImport(server);
    const imageId = run?.photos[0]?.imageId ?? "";

    expect(imageId).toMatch(/^[0-9a-f\-]{36}$/v);
    expect(run?.photos).toEqual([
      { id, path: "/a.jpg", status: "added", imageId },
    ]);
    expect(
      (await server.client.admin.images.get({ id: imageId })).deliveryImages,
    ).not.toEqual([]);
    expect(
      (await server.client.admin.dropbox.photos()).photos.map((photo) => ({
        id: photo.id,
        imported: photo.imported,
      })),
    ).toEqual([
      { id, imported: { imageId, importedAt: TEST_NOW.toISOString() } },
    ]);
  });

  test("同じ中身の写真は、別のファイルでも取り込み直さないこと", async () => {
    await using server = await prepare();
    const bytes = await readPhoto();
    const first = await server.dropbox.put("/a.jpg", bytes);
    const copy = await server.dropbox.put("/copy.jpg", bytes);

    await server.client.admin.dropbox.startImport({ ids: [first, copy] });
    const run = await waitForImport(server);
    const imageId = run?.photos[0]?.imageId ?? null;

    expect(
      run?.photos.map(({ status, imageId: id }) => ({ status, id })),
    ).toEqual([
      { status: "added", id: imageId },
      { status: "already-added", id: imageId },
    ]);

    await server.client.admin.dropbox.startImport({ ids: [first] });

    expect((await waitForImport(server))?.photos[0]?.status).toBe(
      "already-added",
    );
    expect((await server.client.admin.images.list({})).images).toHaveLength(1);
  });

  test("画像を消しても記録は残し、同じ写真を取り込み直さないこと", async () => {
    await using server = await prepare();
    const id = await server.dropbox.put("/a.jpg", await readPhoto());

    await server.client.admin.dropbox.startImport({ ids: [id] });
    const imageId = (await waitForImport(server))?.photos[0]?.imageId ?? "";

    await server.client.admin.images.delete({ id: imageId });

    expect(
      (await server.client.admin.dropbox.photos()).photos[0]?.imported,
    ).toEqual({ imageId: null, importedAt: TEST_NOW.toISOString() });

    await server.client.admin.dropbox.startImport({ ids: [id] });

    expect((await waitForImport(server))?.photos[0]).toMatchObject({
      status: "already-added",
      imageId: null,
    });
  });

  test("無い写真と対応しない形式の写真は、それぞれの状態で終え、残りを取り込むこと", async () => {
    await using server = await prepare();
    const broken = await server.dropbox.put("/broken.jpg", new Uint8Array([1]));
    const gone = await server.dropbox.put("/gone.jpg", await readPhoto());
    const good = await server.dropbox.put("/good.png", await readPhoto());

    server.dropbox.remove("/gone.jpg");
    await server.client.admin.dropbox.startImport({
      ids: [broken, "id:unknown", gone, good],
    });

    expect(
      (await waitForImport(server))?.photos.map(({ status }) => status),
    ).toEqual(["unsupported", "not-found", "not-found", "added"]);
  });

  test("取り込みの途中は、次の取り込みも切断も断ること", async () => {
    const { conversions, open } = gatedConversions();
    await using server = await prepare(conversions);
    const id = await server.dropbox.put("/a.jpg", await readPhoto());

    await server.client.admin.dropbox.startImport({ ids: [id] });

    expect(
      await catchErrorCode(
        server.client.admin.dropbox.startImport({ ids: [id] }),
      ),
    ).toBe("IMPORT_RUNNING");
    expect(await catchErrorCode(server.client.admin.dropbox.disconnect())).toBe(
      "IMPORT_RUNNING",
    );

    open();
    await waitForImport(server);
    await server.client.admin.dropbox.disconnect();
  });

  test("Dropbox の側で切られたら、残りの写真を取り込まずに終えること", async () => {
    const { conversions, reached, open } = gatedConversions();
    await using server = await prepare(conversions);
    const bytes = await readPhoto();
    const first = await server.dropbox.put("/a.jpg", bytes);

    const second = await server.dropbox.put(
      "/b.jpg",
      new Uint8Array([...bytes, 0]),
    );

    await server.client.admin.dropbox.startImport({ ids: [first, second] });
    await reached;
    server.dropbox.unlink();
    open();

    expect(
      (await waitForImport(server))?.photos.map(({ status }) => status),
    ).toEqual(["added", "failed"]);
  });

  test("server を起動してから取り込んでいなければ、進み具合は無いこと", async () => {
    await using server = await prepare();

    expect(await server.client.admin.dropbox.getImport()).toBeNull();
  });
});
