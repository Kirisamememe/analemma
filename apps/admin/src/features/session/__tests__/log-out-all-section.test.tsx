import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "bun:test";

import { createPasskeyRoutes } from "../../../testing/create-passkey-routes";
import { renderApp } from "../../../testing/render-app";

afterEach(cleanup);

const confirmLogOutAll = async (): Promise<void> => {
  await userEvent.click(
    await screen.findByRole("button", {
      name: "すべてのセッションからログアウト",
    }),
  );

  const dialog = await screen.findByRole("dialog", {
    name: "すべてのセッションからログアウトしますか?",
  });

  await userEvent.click(
    within(dialog).getByRole("button", {
      name: "すべてのセッションからログアウト",
    }),
  );
};

describe("LogOutAllSection", () => {
  test("確かめてからログアウトし、ログインの画面に移る", async () => {
    const server = createPasskeyRoutes([]);
    const { calls, history } = renderApp({
      path: "/security",
      routes: server.routes,
    });

    await confirmLogOutAll();

    expect(
      await screen.findByRole("heading", { name: "Stilus にログイン" }),
    ).toBeDefined();
    expect(calls).toContain("admin/session/logOutAll");
    expect(history.location.pathname).toBe("/login");
  });

  test("ログアウトできなければ、確かめの画面に知らせる", async () => {
    const server = createPasskeyRoutes([]);

    server.replyNext("admin/session/logOutAll", () => ({
      error: "INTERNAL_SERVER_ERROR",
      status: 500,
      defined: false,
    }));
    renderApp({ path: "/security", routes: server.routes });

    await confirmLogOutAll();

    expect((await screen.findByRole("alert")).textContent).toBe(
      "ログアウトできませんでした。もう一度試してください。",
    );
  });

  test("失敗してから閉じて開き直すと、前の失敗の知らせは出さない", async () => {
    const server = createPasskeyRoutes([]);

    server.replyNext("admin/session/logOutAll", () => ({
      error: "INTERNAL_SERVER_ERROR",
      status: 500,
      defined: false,
    }));
    renderApp({ path: "/security", routes: server.routes });

    await confirmLogOutAll();
    await screen.findByRole("alert");
    await userEvent.click(screen.getByRole("button", { name: "やめる" }));
    await userEvent.click(
      screen.getByRole("button", { name: "すべてのセッションからログアウト" }),
    );
    await screen.findByRole("dialog");

    expect(screen.queryByRole("alert")).toBeNull();
  });
});
