import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "bun:test";

import { wrapFakeRoute } from "@/testing/create-fake-api";
import { createPasskeyRoutes } from "@/testing/fake-routes/create-passkey-routes";
import { renderApp } from "@/testing/render-app";

afterEach(cleanup);

describe("PasskeyList", () => {
  test("一覧を読み込めなければ、そのことを知らせ、もう一度試すと一覧を出す", async () => {
    const server = createPasskeyRoutes([{ name: "MacBook", backedUp: true }]);
    const list = server.routes["admin/passkeys/list"];
    let isListBroken = true;

    renderApp({
      path: "/security",
      routes: {
        ...server.routes,
        "admin/passkeys/list": wrapFakeRoute(list, (input) =>
          isListBroken
            ? { error: "INTERNAL_SERVER_ERROR", defined: false }
            : list(input),
        ),
      },
    });

    const alert = await screen.findByRole("alert", {}, { timeout: 5000 });

    expect(
      within(alert).getByRole("heading", {
        name: "パスキーを読み込めませんでした",
      }),
    ).toBeDefined();

    isListBroken = false;
    await userEvent.click(screen.getByRole("button", { name: "もう一度試す" }));

    expect(await screen.findByText("MacBook")).toBeDefined();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
