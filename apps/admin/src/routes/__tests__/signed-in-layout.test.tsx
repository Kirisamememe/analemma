import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "bun:test";

import { createPasskeyRoutes } from "../../testing/create-passkey-routes";
import { renderApp } from "../../testing/render-app";

afterEach(cleanup);

describe("ログインした後のナビ", () => {
  test.each([
    { path: "/security", current: "セキュリティ", other: "ホーム" },
    { path: "/", current: "ホーム", other: "セキュリティ" },
  ])(
    "$path を開くと、$current を今いる画面として伝える",
    async ({ path, current, other }) => {
      renderApp({ path, routes: createPasskeyRoutes([]).routes });

      const sidebar = within(await screen.findByRole("complementary"));
      const nav = within(sidebar.getByRole("navigation", { name: "メイン" }));

      expect(
        nav.getByRole("link", { current: "page", name: current }),
      ).toBeDefined();
      expect(
        nav.getByRole("link", { current: false, name: other }),
      ).toBeDefined();
    },
  );

  test("上の帯からナビを開き、リンクを押すと画面が移り、ナビが閉じる", async () => {
    const { history } = renderApp({
      path: "/",
      routes: createPasskeyRoutes([]).routes,
    });
    const banner = within(await screen.findByRole("banner"));
    const open = banner.getByRole("button", { name: "ナビを開く" });

    await userEvent.click(open);
    const dialog = within(await screen.findByRole("dialog", { name: "ナビ" }));
    await userEvent.click(dialog.getByRole("link", { name: "セキュリティ" }));

    const main = within(await screen.findByRole("main"));
    expect(
      await main.findByRole("heading", { name: "セキュリティ" }),
    ).toBeDefined();
    expect(history.location.pathname).toBe("/security");
    expect(screen.queryByRole("dialog", { name: "ナビ" })).toBeNull();
  });

  test("ログインの画面にはナビが出ない", async () => {
    renderApp({ path: "/login", routes: {} });

    await screen.findByRole("heading", { name: "Stilus にログイン" });

    expect(screen.queryByRole("navigation")).toBeNull();
    expect(screen.queryByRole("button", { name: "ナビを開く" })).toBeNull();
  });
});
