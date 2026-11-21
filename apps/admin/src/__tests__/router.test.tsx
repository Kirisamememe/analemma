import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "bun:test";

import { renderApp } from "../testing/render-app";

afterEach(cleanup);

const SIGNED_IN = {
  "admin/session/get": () => ({
    output: { expiresAt: "2026-01-08T00:00:00.000Z" },
  }),
};

describe("router", () => {
  test("無いパスを開くと、選んだ言語の 404 を出し、ホームへ戻れる", async () => {
    const { history } = renderApp({ path: "/missing", routes: SIGNED_IN });

    expect(
      await screen.findByRole("heading", { name: "ページが見つかりません" }),
    ).toBeDefined();
    expect(screen.getByText("/missing にページはありません。")).toBeDefined();

    await userEvent.click(screen.getByRole("link", { name: "ホームに戻る" }));

    expect(
      await screen.findByRole("heading", { name: "Stilus" }),
    ).toBeDefined();
    expect(history.location.pathname).toBe("/");
  });

  test("ログインしていなければ、ログインの画面に、元のパスを持たせて移る", async () => {
    const { history } = renderApp({
      path: "/?tab=pages",
      routes: {
        "admin/session/get": () => ({ error: "UNAUTHORIZED", status: 401 }),
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
});
