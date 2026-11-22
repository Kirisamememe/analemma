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
      defined: false,
    });

    await pressLogOut();

    expect((await screen.findByRole("alert")).textContent).toBe(
      "ログアウトできませんでした。もう一度試してください。",
    );
    expect(history.location.pathname).toBe("/");
  });

  test("送信中にナビを開き直してもログアウトを続けて送らない", async () => {
    const reply = Promise.withResolvers<FakeReply<"admin/session/logOut">>();
    const { calls } = renderHome(reply.promise);
    const banner = within(await screen.findByRole("banner"));
    const open = banner.getByRole("button", { name: "ナビを開く" });

    await userEvent.click(open);
    const drawer = within(await screen.findByRole("dialog", { name: "ナビ" }));
    await userEvent.click(drawer.getByRole("button", { name: "ログアウト" }));
    await drawer.findByRole("progressbar", { name: "処理中" });

    await userEvent.keyboard("{Escape}");
    await userEvent.click(open);
    const reopened = within(
      await screen.findByRole("dialog", { name: "ナビ" }),
    );
    await reopened.findByRole("progressbar", { name: "処理中" });
    await userEvent.click(reopened.getByRole("button", { name: "ログアウト" }));
    expect(
      calls.filter((call) => call === "admin/session/logOut"),
    ).toHaveLength(1);

    reply.resolve({ output: undefined });
    await screen.findByRole("heading", { name: "Stilus にログイン" });
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
