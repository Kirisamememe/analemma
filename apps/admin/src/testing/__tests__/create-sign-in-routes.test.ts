import { describe, expect, test } from "bun:test";

import { createSignInRoutes } from "../create-sign-in-routes";

const EXPIRY = { output: { expiresAt: "2026-01-08T00:00:00.000Z" } };

describe("createSignInRoutes", () => {
  test("ログインの検証が成功を返すまでは 401、返した後はセッションを返す", async () => {
    const routes = createSignInRoutes(EXPIRY);

    expect(await routes["admin/session/get"]?.(undefined)).toEqual({
      error: "UNAUTHORIZED",
      status: 401,
    });
    expect(await routes["auth/login/verify"]?.(undefined)).toEqual(EXPIRY);
    expect(await routes["admin/session/get"]?.(undefined)).toEqual(EXPIRY);
  });

  test("ログインの検証が失敗を返したら、401 のまま", async () => {
    const failure = { error: "UNKNOWN_CREDENTIAL", status: 401 };
    const routes = createSignInRoutes(failure);

    expect(await routes["auth/login/verify"]?.(undefined)).toEqual(failure);
    expect(await routes["admin/session/get"]?.(undefined)).toEqual({
      error: "UNAUTHORIZED",
      status: 401,
    });
  });
});
