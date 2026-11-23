import { describe, expect, test } from "bun:test";

import { createFakeApi } from "@/testing/create-fake-api";
import { FAKE_ASSERTION } from "@/testing/create-fake-authenticator";
import { createSignInRoutes } from "@/testing/fake-routes/create-sign-in-routes";

const EXPIRY = { expiresAt: "2026-01-08T00:00:00.000Z" };

describe("createSignInRoutes", () => {
  test("ログインの検証が成功を返すまでは 401、返した後はセッションを返す", async () => {
    const { api } = createFakeApi(createSignInRoutes({ output: EXPIRY }));

    const before: unknown = await api.admin.session
      .get()
      .catch((error: unknown) => error);

    expect(before).toMatchObject({ code: "UNAUTHORIZED", status: 401 });
    expect(await api.auth.login.verify(FAKE_ASSERTION)).toEqual(EXPIRY);
    expect(await api.admin.session.get()).toEqual(EXPIRY);
  });

  test("ログインの検証が失敗を返したら、401 のまま", async () => {
    const { api } = createFakeApi(
      createSignInRoutes({ error: "UNKNOWN_CREDENTIAL" }),
    );

    const failure: unknown = await api.auth.login
      .verify(FAKE_ASSERTION)
      .catch((error: unknown) => error);

    const session: unknown = await api.admin.session
      .get()
      .catch((error: unknown) => error);

    expect(failure).toMatchObject({ code: "UNKNOWN_CREDENTIAL", status: 401 });
    expect(session).toMatchObject({ code: "UNAUTHORIZED", status: 401 });
  });

  test("ログインの出力の検証で失敗したら、セッションは成立しないこと", async () => {
    const { api } = createFakeApi(
      createSignInRoutes({ output: { expiresAt: "invalid" } }),
    );

    const failure: unknown = await api.auth.login
      .verify(FAKE_ASSERTION)
      .catch((error: unknown) => error);

    const session: unknown = await api.admin.session
      .get()
      .catch((error: unknown) => error);

    expect(failure).toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
      status: 500,
    });
    expect(session).toMatchObject({ code: "UNAUTHORIZED", status: 401 });
  });
});
