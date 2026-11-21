import { isContractProcedure } from "@orpc/contract";
import { describe, expect, test } from "bun:test";

import { contract } from "@analemma/contract";

import {
  TEST_ORIGIN,
  createTestClient,
} from "../../../test-client/create-test-client";

const procedurePaths = (node: unknown, path: string): string[] => {
  if (isContractProcedure(node)) {
    return [path];
  }

  if (typeof node !== "object" || node === null) {
    return [];
  }

  return Object.entries(node).flatMap(([key, child]) =>
    procedurePaths(child, `${path}/${key}`),
  );
};

const adminPaths = procedurePaths(contract.admin, "admin");
const authPaths = procedurePaths(contract.auth, "auth");

const VALID_LOOKING_TOKEN = `${"A".repeat(22)}.${"B".repeat(43)}`;

const post = (path: string, headers: Record<string, string>): Request =>
  new Request(`${TEST_ORIGIN}/api/${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify({ json: null }),
  });

const callWithoutCookie = async (path: string): Promise<Response> => {
  await using server = await createTestClient();

  return await server.app.fetch(post(path, { origin: TEST_ORIGIN }));
};

describe("contract の管理用の procedure", () => {
  test("1つ以上あること", () => {
    expect(adminPaths.length).toBeGreaterThan(0);
  });

  test.each(adminPaths)(
    "%s は、セッションの Cookie が無いと 401 と UNAUTHORIZED を返し、キャッシュさせないこと",
    async (path) => {
      const response = await callWithoutCookie(path);
      const body: unknown = await response.json();

      expect(response.status).toBe(401);
      expect(body).toMatchObject({ json: { code: "UNAUTHORIZED" } });
      expect(response.headers.get("cache-control")).toBe("no-store");
    },
  );
});

describe("contract の認証用の procedure", () => {
  test("1つ以上あること", () => {
    expect(authPaths.length).toBeGreaterThan(0);
  });

  test.each(authPaths)("%s の応答を、キャッシュさせないこと", async (path) => {
    const response = await callWithoutCookie(path);

    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});

describe("Origin の確認", () => {
  test.each([...adminPaths, ...authPaths])(
    "%s は、Origin が管理画面の origin と違うか無ければ、403 と FORBIDDEN を返すこと",
    async (path) => {
      await using server = await createTestClient();

      for (const headers of [
        { origin: "https://evil.example" },
        { origin: "https://analemma.test:8443" },
        { origin: "null" },
        {},
      ]) {
        const response = await server.app.fetch(post(path, headers));
        const body: unknown = await response.json();

        expect(response.status).toBe(403);
        expect(body).toMatchObject({ json: { code: "FORBIDDEN" } });
      }
    },
  );

  test("Origin が違うリクエストは、challenge を出す前に断ること", async () => {
    await using server = await createTestClient();
    const response = await server.app.fetch(
      post("auth/login/options", { origin: "https://evil.example" }),
    );

    expect(response.status).toBe(403);
    expect(
      server.logs.map(({ level, message }) => `${level}: ${message}`),
    ).toEqual(["warn: 管理画面の origin からでないリクエストを断った"]);
  });

  test("読むだけの GET では、Origin が無くてもセッションの確認に進むこと", async () => {
    await using server = await createTestClient();
    const response = await server.app.fetch(
      new Request(`${TEST_ORIGIN}/api/admin/session/get`),
    );

    expect(response.status).toBe(401);
  });

  test("ブラウザが同じ origin からでないと示すリクエストは、GET でも 403 にすること", async () => {
    await using server = await createTestClient();

    for (const site of ["same-site", "cross-site", "none"]) {
      const response = await server.app.fetch(
        new Request(`${TEST_ORIGIN}/api/admin/session/get`, {
          headers: { "sec-fetch-site": site },
        }),
      );

      expect(response.status).toBe(403);
    }

    const sameOrigin = await server.app.fetch(
      post("admin/session/get", {
        origin: TEST_ORIGIN,
        "sec-fetch-site": "same-origin",
      }),
    );

    expect(sameOrigin.status).toBe(401);
  });

  test("書き換える procedure を GET では呼べないこと", async () => {
    await using server = await createTestClient();
    const response = await server.app.fetch(
      new Request(`${TEST_ORIGIN}/api/auth/login/options`),
    );

    expect(response.status).toBe(405);
  });
});

describe("procedure に届く前に断る応答", () => {
  test.each(["admin/session/get", "auth/login/verify"])(
    "%s への、別の origin からのフォームの送信と大きすぎる本文も、キャッシュさせないこと",
    async (path) => {
      await using server = await createTestClient();
      const form = await server.app.fetch(
        new Request(`${TEST_ORIGIN}/api/${path}`, {
          method: "POST",
          headers: {
            "content-type": "application/x-www-form-urlencoded",
            origin: "https://evil.example",
          },
          body: "a=1",
        }),
      );
      const large = await server.app.fetch(
        new Request(`${TEST_ORIGIN}/api/${path}`, {
          method: "POST",
          headers: { "content-type": "application/json", origin: TEST_ORIGIN },
          body: "x".repeat(1024 * 1024 + 1),
        }),
      );

      expect([form.status, large.status]).toEqual([403, 413]);
      expect(form.headers.get("cache-control")).toBe("no-store");
      expect(large.headers.get("cache-control")).toBe("no-store");
    },
  );
});

describe("セッションの Cookie", () => {
  test("知らない token の Cookie では UNAUTHORIZED を返し、その Cookie を消させること", async () => {
    await using server = await createTestClient();

    for (const token of ["unknown", VALID_LOOKING_TOKEN]) {
      const response = await server.app.fetch(
        post("admin/session/get", {
          origin: TEST_ORIGIN,
          cookie: `__Host-analemma_session=${token}`,
        }),
      );

      const setCookies = response.headers.getSetCookie();

      expect(response.status).toBe(401);
      expect(setCookies).toHaveLength(1);
      expect(setCookies[0]).toMatch(/^__Host-analemma_session=; Max-Age=0;/v);
    }
  });

  test("セッションを探す処理が想定外に失敗したら、500 にしてログに残すこと", async () => {
    await using server = await createTestClient({
      clock: {
        now: () => {
          throw new Error("時計が読めない");
        },
      },
      cookie: `__Host-analemma_session=${VALID_LOOKING_TOKEN}`,
    });
    const error = await server.client.admin.session
      .get()
      .catch((error_: unknown) => error_);

    expect(error).toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
    expect(server.logs.map((entry) => entry.level)).toEqual(["error"]);
  });
});
