import { describe, expect, test } from "bun:test";

import { PHOTO_MAX_BYTES } from "@analemma/contract";

import {
  catchErrorCode,
  createTestClient,
  signInAsAdmin,
  TEST_NOW,
  uploadRequest,
} from "@/test-client";

const MEGABYTE = 1024 * 1024;

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

  test("ログイン中でも、写真を送る procedure のほかには、ファイルを含む本文にも 1 MB の上限を掛けること", async () => {
    await using server = await createTestClient();
    await signInAsAdmin(server);

    const response = await server.app.fetch(
      uploadRequest(server, {
        size: 2 * MEGABYTE,
        cookie: true,
        path: "fixedPages/update",
      }),
    );

    expect(response.status).toBe(413);
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

  test("本文の上限を決めるためのセッションの確認に失敗したら、500 にしてログに書くこと", async () => {
    let failing = false;

    await using server = await createTestClient({
      clock: {
        now: () => {
          if (failing) throw new Error("時刻を読めない");

          return TEST_NOW;
        },
      },
    });
    await signInAsAdmin(server);
    failing = true;

    const response = await server.app.fetch(
      uploadRequest(server, { size: 16, cookie: true }),
    );

    expect(response.status).toBe(500);
    expect(server.logs.at(-1)).toMatchObject({
      level: "error",
      message: "HTTP の処理で想定外の失敗が起きた",
    });
  });
});
