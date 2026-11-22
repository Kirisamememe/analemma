import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "bun:test";

import type { FakeReply } from "../../../testing/create-fake-api";
import { renderApp } from "../../../testing/render-app";

afterEach(cleanup);

const EXPIRY = { output: { expiresAt: "2026-01-08T00:00:00.000Z" } };

const renderHome = (
  logOut:
    | FakeReply<"admin/session/logOut">
    | Promise<FakeReply<"admin/session/logOut">>,
) =>
  renderApp({
    path: "/",
    routes: {
      "admin/session/get": () => EXPIRY,
      "admin/session/logOut": () => logOut,
    },
  });

const pressLogOut = async (): Promise<void> => {
  const sidebar = within(await screen.findByRole("complementary"));
  await userEvent.click(sidebar.getByRole("button", { name: "ログアウト" }));
};

const openDrawer = async () => {
  const banner = within(await screen.findByRole("banner"));
  await userEvent.click(banner.getByRole("button", { name: "ナビを開く" }));

  return screen.findByRole("dialog", { name: "ナビ" });
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

  test("ログアウトできなければ、引き出したナビの中に知らせる", async () => {
    const { history } = renderHome({
      error: "INTERNAL_SERVER_ERROR",
      defined: false,
    });

    const drawer = within(await openDrawer());
    await userEvent.click(drawer.getByRole("button", { name: "ログアウト" }));

    expect((await drawer.findByRole("alert")).textContent).toBe(
      "ログアウトできませんでした。もう一度試してください。",
    );
    expect(history.location.pathname).toBe("/");
  });

  test("送信中はナビを閉じず、応答が届いたらログインの画面に移る", async () => {
    const reply = Promise.withResolvers<FakeReply<"admin/session/logOut">>();
    const { calls, history } = renderHome(reply.promise);

    const dialog = await openDrawer();
    const drawer = within(dialog);
    await userEvent.click(drawer.getByRole("button", { name: "ログアウト" }));
    await drawer.findByRole("progressbar", { name: "処理中" });

    await userEvent.keyboard("{Escape}");
    expect(screen.getByRole("dialog", { name: "ナビ" })).toBe(dialog);

    const close = drawer.getByRole("button", { name: "ナビを閉じる" });
    expect(close).toHaveProperty("disabled", true);
    await userEvent.click(close);
    expect(screen.getByRole("dialog", { name: "ナビ" })).toBe(dialog);
    expect(drawer.getByRole("progressbar", { name: "処理中" })).toBeDefined();

    await userEvent.click(drawer.getByRole("button", { name: "ログアウト" }));
    expect(
      calls.filter((call) => call === "admin/session/logOut"),
    ).toHaveLength(1);

    reply.resolve({ output: undefined });
    await screen.findByRole("heading", { name: "Stilus にログイン" });
    expect(history.location.pathname).toBe("/login");
  });

  test("セッションが切れていたら、ログインの画面に移る", async () => {
    const { history } = renderHome({ error: "UNAUTHORIZED" });

    await pressLogOut();

    expect(
      await screen.findByRole("heading", { name: "Stilus にログイン" }),
    ).toBeDefined();
    expect(history.location.pathname).toBe("/login");
  });
});
