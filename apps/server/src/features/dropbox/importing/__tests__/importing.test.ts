import { describe, expect, test } from "bun:test";

import {
  catchErrorCode,
  connectTestDropbox,
  createTestClient,
  signInAsAdmin,
} from "@/test-client";

const FIXTURE = new URL(
  "../../../images/processing/__tests__/wide-red.jpg",
  import.meta.url,
);

const readPhoto = async (): Promise<Uint8Array> =>
  new Uint8Array(await (await fetch(FIXTURE)).arrayBuffer());

const prepare = async () => {
  const server = await createTestClient();

  await signInAsAdmin(server);
  await connectTestDropbox(server);

  return server;
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
