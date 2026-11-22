import { act, cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "bun:test";

import { createPasskeyRoutes } from "@/testing/fake-routes/create-passkey-routes";
import { renderApp } from "@/testing/render-app";

afterEach(cleanup);

const dismissButtons = (label: string): HTMLElement[] =>
  screen.queryAllByLabelText(label, { selector: "button" });

describe("App", () => {
  test("言語を切り替えると、開いている画面の文言を、その言語で描き直す", async () => {
    const { i18n } = renderApp({
      path: "/missing",
      routes: {
        "admin/session/get": () => ({
          output: { expiresAt: "2026-01-08T00:00:00.000Z" },
        }),
      },
    });

    expect(
      await screen.findByRole("heading", { name: "ページが見つかりません" }),
    ).toBeDefined();

    await act(async () => i18n.changeLanguage("zh-Hans"));

    expect(screen.getByRole("heading", { name: "找不到页面" })).toBeDefined();
    expect(screen.getByText("/missing 处没有页面。")).toBeDefined();
  });

  test("言語を切り替えると、React Aria Components が出す文言も、その言語にする", async () => {
    const server = createPasskeyRoutes([{ name: "MacBook", backedUp: true }]);
    const { i18n } = renderApp({ path: "/security", routes: server.routes });

    await userEvent.click(
      await screen.findByRole("button", { name: "パスキーを追加" }),
    );

    expect(
      (await screen.findAllByLabelText("閉じる", { selector: "button" }))
        .length,
    ).toBeGreaterThan(0);

    await act(async () => i18n.changeLanguage("zh-Hans"));

    expect(dismissButtons("取消").length).toBeGreaterThan(0);

    await act(async () => i18n.changeLanguage("en"));

    expect(dismissButtons("Dismiss").length).toBeGreaterThan(0);
  });
});
