import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "bun:test";

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

  test("セッションを確かめられなければ、訳した知らせを出し、やり直せる", async () => {
    let reachable = false;

    renderApp({
      path: "/",
      routes: {
        "admin/session/get": () =>
          reachable
            ? { output: { expiresAt: "2026-01-08T00:00:00.000Z" } }
            : { error: "INTERNAL_SERVER_ERROR", defined: false },
      },
    });

    expect((await screen.findByRole("alert")).textContent).toBe(
      "ログイン状態を確認できませんでした。もう一度試してください。",
    );
    expect(screen.queryByRole("navigation")).toBeNull();

    reachable = true;
    await userEvent.click(screen.getByRole("button", { name: "もう一度試す" }));

    expect(
      await screen.findByRole("heading", { name: "ホーム" }),
    ).toBeDefined();
  });
});
