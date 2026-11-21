import { RouterProvider, createMemoryHistory } from "@tanstack/react-router";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "bun:test";

import { LocaleContext } from "../i18n/locale-context";
import { createAppRouter } from "../router";

afterEach(cleanup);

describe("router", () => {
  test("無いパスを開くと、選んだ言語の 404 を出し、ホームへ戻れる", async () => {
    const history = createMemoryHistory({ initialEntries: ["/missing"] });

    render(
      <LocaleContext value="ja">
        <RouterProvider router={createAppRouter(history)} />
      </LocaleContext>,
    );

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
});
