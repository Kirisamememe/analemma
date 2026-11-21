import { cleanup, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { createPasskeyRoutes } from "../../../testing/create-passkey-routes";
import { renderApp } from "../../../testing/render-app";

afterEach(cleanup);

describe("PasskeyList", () => {
  test("パスキーごとに、名前・同期されているか・登録と最後に使った日時を出す", async () => {
    const server = createPasskeyRoutes([
      { id: "passkey-1", name: "MacBook", backedUp: true },
      { id: "passkey-2", name: "YubiKey", backedUp: false },
    ]);

    renderApp({ path: "/security", routes: server.routes, locale: "en" });

    const [macbook, yubikey] = await screen.findAllByRole("listitem");

    expect(within(macbook!).getByText("MacBook")).toBeDefined();
    expect(within(macbook!).getByText("Synced")).toBeDefined();
    expect(
      within(macbook!).getByText(/Registered .+ ・ Last used /v),
    ).toBeDefined();
    expect(within(yubikey!).getByText("YubiKey")).toBeDefined();
    expect(within(yubikey!).queryByText("Synced")).toBeNull();
  });

  test("一覧を読み込めなければ、そのことを知らせる", async () => {
    const server = createPasskeyRoutes([]);

    renderApp({
      path: "/security",
      routes: {
        ...server.routes,
        "admin/passkeys/list": () => ({
          error: "INTERNAL_SERVER_ERROR",
          status: 500,
          defined: false,
        }),
      },
    });

    expect(
      await screen.findByText(
        "パスキーを読み込めませんでした。",
        {},
        { timeout: 5000 },
      ),
    ).toBeDefined();
  });
});
