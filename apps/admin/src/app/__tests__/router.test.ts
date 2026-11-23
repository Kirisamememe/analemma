import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "bun:test";

import type { FakeReply } from "@/testing/create-fake-api";
import { renderApp } from "@/testing/render-app";

afterEach(cleanup);

const SIGNED_IN = {
  "admin/session/get": () => ({
    output: { expiresAt: "2026-01-08T00:00:00.000Z" },
  }),
};

describe("router", () => {
  test.each(["/missing", "/security/missing"])(
    "無いパス %s ではナビを出さず、訳した 404 からホームへ戻れる",
    async (path) => {
      const { history } = renderApp({ path, routes: SIGNED_IN });

      expect(
        await screen.findByRole("heading", { name: "ページが見つかりません" }),
      ).toBeDefined();
      expect(screen.getByText(`${path} にページはありません。`)).toBeDefined();
      expect(screen.queryByRole("navigation")).toBeNull();

      await userEvent.click(screen.getByRole("link", { name: "ホームに戻る" }));

      expect(
        await screen.findByRole("heading", { name: "ホーム" }),
      ).toBeDefined();
      expect(history.location.pathname).toBe("/");
    },
  );

  test("ログインしていなければ、ログインの画面に、元のパスを持たせて移る", async () => {
    const { history } = renderApp({
      path: "/?tab=pages",
      routes: {
        "admin/session/get": () => ({ error: "UNAUTHORIZED" }),
      },
    });

    expect(
      await screen.findByRole("heading", { name: "Stilus にログイン" }),
    ).toBeDefined();
    expect(history.location.pathname).toBe("/login");
    expect(new URLSearchParams(history.location.search).get("redirect")).toBe(
      "/?tab=pages",
    );
  });

  test("セッション切れで移った画面の履歴をログインの画面に置き換え、「戻る」では前のパスをログインの画面に引き継ぐ", async () => {
    let signedIn = true;

    const { history } = renderApp({
      path: "/",
      routes: {
        "admin/session/get": () =>
          signedIn
            ? { output: { expiresAt: "2026-01-08T00:00:00.000Z" } }
            : { error: "UNAUTHORIZED" },
      },
    });

    await screen.findByRole("heading", { name: "ホーム" });
    signedIn = false;
    const [security] = screen.getAllByRole("link", { name: "セキュリティ" });

    if (security === undefined) {
      throw new Error("セキュリティのリンクがありません");
    }

    await userEvent.click(security);

    expect(
      await screen.findByRole("heading", { name: "Stilus にログイン" }),
    ).toBeDefined();
    expect(history.length).toBe(2);

    history.back();

    await waitFor(() => {
      expect(new URLSearchParams(history.location.search).get("redirect")).toBe(
        "/",
      );
    });
  });

  test("セッションの確認の応答を待たずに、画面を描く", async () => {
    const session = Promise.withResolvers<FakeReply<"admin/session/get">>();

    renderApp({
      path: "/",
      routes: { "admin/session/get": () => session.promise },
    });

    expect(
      await screen.findByRole("heading", { name: "ホーム" }),
    ).toBeDefined();
    session.resolve({ output: { expiresAt: "2026-01-08T00:00:00.000Z" } });
  });

  test("セッションを確かめられなくても、画面を止めない", async () => {
    renderApp({
      path: "/",
      routes: {
        "admin/session/get": () => ({
          error: "INTERNAL_SERVER_ERROR",
          defined: false,
        }),
      },
    });

    expect(
      await screen.findByRole("heading", { name: "ホーム" }),
    ).toBeDefined();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
