import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "bun:test";

import type { FakeReply } from "../../../testing/create-fake-api";
import { renderApp } from "../../../testing/render-app";

afterEach(cleanup);

const EXPIRY = { output: { expiresAt: "2026-01-08T00:00:00.000Z" } };

const renderHome = (logOut: FakeReply) =>
  renderApp({
    path: "/",
    routes: {
      "admin/session/get": () => EXPIRY,
      "admin/session/logOut": () => logOut,
    },
  });

const pressLogOut = async (): Promise<void> => {
  await userEvent.click(
    await screen.findByRole("button", { name: "ログアウト" }),
  );
};

describe("LogOutButton", () => {
  test("ログアウトすると、ログインの画面に移る", async () => {
    const { calls, history } = renderHome({ output: undefined });

    await pressLogOut();

    expect(
      await screen.findByRole("heading", { name: "Stilus にログイン" }),
    ).toBeDefined();
    expect(calls).toContain("admin/session/logOut");
    expect(history.location.pathname).toBe("/login");
  });

  test("ログアウトできなければ、そのことを出し、画面に留まる", async () => {
    const { history } = renderHome({
      error: "INTERNAL_SERVER_ERROR",
      status: 500,
      defined: false,
    });

    await pressLogOut();

    expect((await screen.findByRole("alert")).textContent).toBe(
      "ログアウトできませんでした。もう一度試してください。",
    );
    expect(history.location.pathname).toBe("/");
  });

  test("セッションが切れていたら、ログインの画面に移る", async () => {
    const { history } = renderHome({ error: "UNAUTHORIZED", status: 401 });

    await pressLogOut();

    expect(
      await screen.findByRole("heading", { name: "Stilus にログイン" }),
    ).toBeDefined();
    expect(history.location.pathname).toBe("/login");
  });
});
