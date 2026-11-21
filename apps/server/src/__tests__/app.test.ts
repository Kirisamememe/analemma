import { describe, expect, test } from "bun:test";

import {
  TEST_ORIGIN,
  createTestClient,
} from "../test-client/create-test-client";

const request = (path: string, init: RequestInit): Request =>
  new Request(`${TEST_ORIGIN}${path}`, init);

describe("API の入口", () => {
  test.each(["HEAD", "OPTIONS", "PUT", "DELETE"])(
    "%s では procedure を呼ばず、405 を返すこと",
    async (method) => {
      await using server = await createTestClient();
      const response = await server.app.fetch(
        request("/api/public/health/get", {
          method,
          headers: { "content-type": "application/json" },
        }),
      );

      expect(response.status).toBe(405);
      expect(response.headers.get("allow")).toBe("GET, POST");
    },
  );

  test("壊れた JSON には 400 を返し、想定外の失敗としてログに残さないこと", async () => {
    await using server = await createTestClient();
    const response = await server.app.fetch(
      request("/api/public/health/get", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{",
      }),
    );

    expect(response.status).toBe(400);
    expect(server.logs).toEqual([]);
  });

  test("別の origin からのフォームの送信を断ること", async () => {
    await using server = await createTestClient();
    const response = await server.app.fetch(
      request("/api/public/health/get", {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          origin: "https://evil.example",
        },
        body: "a=1",
      }),
    );

    expect(response.status).toBe(403);
  });

  test("大きすぎる本文を断ること", async () => {
    await using server = await createTestClient();
    const response = await server.app.fetch(
      request("/api/public/health/get", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "x".repeat(1024 * 1024 + 1),
      }),
    );

    expect(response.status).toBe(413);
  });

  test("知らないパスには 404 を返すこと", async () => {
    await using server = await createTestClient();
    const response = await server.app.fetch(
      request("/api/public/nothing", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ json: null }),
      }),
    );

    expect(response.status).toBe(404);
  });
});

describe("応答のヘッダー", () => {
  test("パスキーの操作を自分の origin だけに許し、ほかのサイトの iframe に入れさせないこと", async () => {
    await using server = await createTestClient();
    const response = await server.app.fetch(
      request("/api/public/health/get", { method: "GET" }),
    );

    expect(response.headers.get("permissions-policy")).toBe(
      "publickey-credentials-create=(self), publickey-credentials-get=(self)",
    );
    expect(response.headers.get("content-security-policy")).toBe(
      "frame-ancestors 'none'",
    );
    expect(response.headers.get("x-frame-options")).toBe("DENY");
  });

  test("管理画面の origin からのフォームの送信は、CSRF の確認で止めないこと", async () => {
    await using server = await createTestClient();
    const response = await server.app.fetch(
      request("/api/public/health/get", {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          origin: TEST_ORIGIN,
        },
        body: "a=1",
      }),
    );

    expect(response.status).not.toBe(403);
  });
});
