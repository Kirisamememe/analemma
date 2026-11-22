import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "bun:test";

import type { Authenticator } from "@/features/auth/webauthn/create-authenticator";
import { createSignInRoutes } from "@/testing/create-sign-in-routes";
import { renderApp } from "@/testing/render-app";

afterEach(cleanup);

const CREDENTIAL = {
  id: "credential-ids",
  type: "public-key" as const,
  response: {
    clientDataJSON: "AQ",
    authenticatorData: "Ag",
    signature: "Aw",
    userHandle: "BA",
  },
};

const answering: Authenticator = {
  authenticate: () =>
    Promise.resolve({ _tag: "Answered", credential: CREDENTIAL }),
  register: () => Promise.resolve({ _tag: "Cancelled" }),
};

const cancelling: Authenticator = {
  authenticate: () => Promise.resolve({ _tag: "Cancelled" }),
  register: () => Promise.resolve({ _tag: "Cancelled" }),
};

const EXPIRY = { output: { expiresAt: "2026-01-08T00:00:00.000Z" } };

const pressLogIn = async (): Promise<void> => {
  await userEvent.click(
    await screen.findByRole("button", { name: "パスキーでログイン" }),
  );
};

describe("LoginPage", () => {
  test("ログインすると、ログインの前に開こうとした画面に戻る", async () => {
    const { history } = renderApp({
      path: "/login?redirect=%2Fmissing",
      routes: createSignInRoutes(EXPIRY),
      authenticator: answering,
    });

    await pressLogIn();

    expect(
      await screen.findByRole("heading", { name: "ページが見つかりません" }),
    ).toBeDefined();
    expect(history.location.pathname).toBe("/missing");
  });

  test("ログインの最中は、ほかの管理用 API を呼ばない", async () => {
    const { calls } = renderApp({
      path: "/login",
      routes: createSignInRoutes(EXPIRY),
      authenticator: answering,
    });

    await pressLogIn();
    await screen.findByRole("heading", { name: "ホーム" });

    expect(calls).toEqual([
      "auth/login/options",
      "auth/login/verify",
      "admin/session/get",
    ]);
  });

  test("登録されていないパスキーなら、そのことを知らせ、ログインの画面に留まる", async () => {
    const { history } = renderApp({
      path: "/login",
      routes: createSignInRoutes({ error: "UNKNOWN_CREDENTIAL" }),
      authenticator: answering,
    });

    await pressLogIn();

    expect((await screen.findByRole("alert")).textContent).toBe(
      "このパスキーは登録されていません。削除されたパスキーかもしれません。",
    );
    expect(history.location.pathname).toBe("/login");
  });

  test("認証器でキャンセルしたら、割り込まずに知らせる", async () => {
    renderApp({
      path: "/login",
      routes: createSignInRoutes(EXPIRY),
      authenticator: cancelling,
    });

    await pressLogIn();

    expect((await screen.findByRole("status")).textContent).toBe(
      "ログインをキャンセルしました。",
    );
    expect(screen.queryByRole("alert")).toBeNull();
  });

  test("ログインの応答を待つ間にほかの画面へ移ったら、その画面から動かさない", async () => {
    const verified = Promise.withResolvers<undefined>();
    const routes = createSignInRoutes(EXPIRY);
    const verify = routes["auth/login/verify"];
    const { history } = renderApp({
      path: "/login?redirect=%2Fsecurity",
      routes: {
        ...routes,
        "auth/login/verify": async () => {
          await verified.promise;

          return verify();
        },
      },
      authenticator: answering,
    });

    await pressLogIn();
    history.push("/missing");
    await screen.findByRole("heading", { name: "ページが見つかりません" });
    verified.resolve(undefined);
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });

    expect(history.location.pathname).toBe("/missing");
  });

  test.each(["/LOGIN", "/login/"])(
    "%s でログインの画面を開いても、ログインすると戻り先に移る",
    async (path) => {
      const { history } = renderApp({
        path: `${path}?redirect=%2Fmissing`,
        routes: createSignInRoutes(EXPIRY),
        authenticator: answering,
      });

      await pressLogIn();

      expect(
        await screen.findByRole("heading", { name: "ページが見つかりません" }),
      ).toBeDefined();
      expect(history.location.pathname).toBe("/missing");
    },
  );

  test("末尾に / の付いたログインの画面を、戻り先なしで開いても、ログインするとホームに移る", async () => {
    const { history } = renderApp({
      path: "/login/",
      routes: createSignInRoutes(EXPIRY),
      authenticator: answering,
    });

    await pressLogIn();

    expect(
      await screen.findByRole("heading", { name: "ホーム" }),
    ).toBeDefined();
    expect(history.location.pathname).toBe("/");
  });
});
