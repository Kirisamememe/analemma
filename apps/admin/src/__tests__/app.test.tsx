import { act, cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { renderApp } from "../testing/render-app";

afterEach(cleanup);

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
});
