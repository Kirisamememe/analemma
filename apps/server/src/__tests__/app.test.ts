import { describe, expect, test } from "bun:test";
import type { Hono } from "hono";

import { contract } from "@analemma/contract";

import {
  TEST_INTERNAL_URL,
  TEST_ORIGIN,
  type TestClient,
  createTestClient,
} from "../test-client/create-test-client";
import { listProcedurePaths } from "../test-client/list-procedure-paths";

const PORTS = [
  {
    port: "外部用のポート",
    url: TEST_ORIGIN,
    path: "/api/admin/session/get",
    appOf: (server: TestClient): Hono => server.app,
  },
  {
    port: "内部用のポート",
    url: TEST_INTERNAL_URL,
    path: "/api/public/health/get",
    appOf: (server: TestClient): Hono => server.internalApp,
  },
];

const postJson = (url: string, body: string): RequestInit => ({
  method: "POST",
  headers: { "content-type": "application/json", origin: url },
  body,
});

describe.each(PORTS)("$port の API の入口", ({ appOf, path, url }) => {
  test.each(["HEAD", "OPTIONS", "PUT", "DELETE"])(
    "%s では procedure を呼ばず、405 を返すこと",
    async (method) => {
      await using server = await createTestClient();
      const response = await appOf(server).fetch(
        new Request(`${url}${path}`, {
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
    const response = await appOf(server).fetch(
      new Request(`${url}${path}`, postJson(url, "{")),
    );

    expect(response.status).toBe(400);
    expect(server.logs).toEqual([]);
  });

  test("大きすぎる本文を断ること", async () => {
    await using server = await createTestClient();
    const response = await appOf(server).fetch(
      new Request(`${url}${path}`, postJson(url, "x".repeat(1024 * 1024 + 1))),
    );

    expect(response.status).toBe(413);
  });

  test("知らないパスには 404 を返すこと", async () => {
    await using server = await createTestClient();
    const response = await appOf(server).fetch(
      new Request(
        `${url}/api/public/nothing`,
        postJson(url, JSON.stringify({ json: null })),
      ),
    );

    expect(response.status).toBe(404);
  });
});

describe("2つのポートの分け方", () => {
  test.each(listProcedurePaths(contract.public, "public"))(
    "%s は、外部用のポートには無いこと",
    async (procedure) => {
      await using server = await createTestClient();
      const response = await server.app.fetch(
        new Request(
          `${TEST_ORIGIN}/api/${procedure}`,
          postJson(TEST_ORIGIN, JSON.stringify({ json: null })),
        ),
      );

      expect(response.status).toBe(404);
    },
  );

  test.each([
    ...listProcedurePaths(contract.admin, "admin"),
    ...listProcedurePaths(contract.auth, "auth"),
  ])("%s は、内部用のポートには無いこと", async (procedure) => {
    await using server = await createTestClient();
    const response = await server.internalApp.fetch(
      new Request(
        `${TEST_INTERNAL_URL}/api/${procedure}`,
        postJson(TEST_INTERNAL_URL, JSON.stringify({ json: null })),
      ),
    );

    expect(response.status).toBe(404);
  });
});

describe("外部用のポートの応答のヘッダー", () => {
  test("パスキーの操作を自分の origin だけに許し、ほかのサイトの iframe に入れさせないこと", async () => {
    await using server = await createTestClient();
    const response = await server.app.fetch(
      new Request(`${TEST_ORIGIN}/api/admin/session/get`),
    );

    expect(response.headers.get("permissions-policy")).toBe(
      "publickey-credentials-create=(self), publickey-credentials-get=(self)",
    );
    expect(response.headers.get("content-security-policy")).toBe(
      "frame-ancestors 'none'",
    );
    expect(response.headers.get("x-frame-options")).toBe("DENY");
  });

  test("別の origin からのフォームの送信を、procedure に届く前の CSRF の確認で断ること", async () => {
    await using server = await createTestClient();
    const response = await server.app.fetch(
      new Request(`${TEST_ORIGIN}/api/admin/session/get`, {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          origin: "https://evil.example",
        },
        body: "a=1",
      }),
    );

    expect(response.status).toBe(403);
    expect(await response.text()).toBe("Forbidden");
    expect(server.logs).toEqual([]);
  });

  test("TLS を終端するリバースプロキシの後ろでも、管理画面の origin からのフォームの送信を、CSRF の確認で止めないこと", async () => {
    await using server = await createTestClient();
    const response = await server.app.fetch(
      new Request("http://127.0.0.1:8787/api/admin/session/get", {
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
