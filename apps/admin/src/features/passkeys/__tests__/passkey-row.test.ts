import { act, cleanup, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { formatDateTime } from "@/i18n/format-date-time";
import {
  PASSKEY_CREATED_AT,
  PASSKEY_LAST_USED_AT,
  createPasskeyRoutes,
} from "@/testing/fake-routes/create-passkey-routes";
import { renderApp } from "@/testing/render-app";

afterEach(cleanup);

describe("PasskeyRow", () => {
  test("パスキーごとに、名前・同期されているか・登録と最後に使った日時を出す", async () => {
    const server = createPasskeyRoutes([
      { name: "MacBook", backedUp: true },
      { name: "YubiKey", backedUp: false },
    ]);

    renderApp({ path: "/security", routes: server.routes, locale: "en" });

    const main = within(await screen.findByRole("main"));
    const [macbook, yubikey] = await main.findAllByRole("listitem");

    expect(within(macbook!).getByText("MacBook")).toBeDefined();
    expect(within(macbook!).getByText("Synced")).toBeDefined();
    expect(
      within(macbook!).getByText(/Registered .+ · Last used /v),
    ).toBeDefined();
    expect(within(yubikey!).getByText("YubiKey")).toBeDefined();
    expect(within(yubikey!).queryByText("Synced")).toBeNull();
  });

  test("言語を切り替えると、登録と最後に使った日時を、その言語の書き方で出し直す", async () => {
    const server = createPasskeyRoutes([{ name: "MacBook", backedUp: true }]);

    const { i18n } = renderApp({
      path: "/security",
      routes: server.routes,
      locale: "en",
    });

    expect(
      await screen.findByText(
        `Registered ${formatDateTime("en", PASSKEY_CREATED_AT)} · Last used ${formatDateTime("en", PASSKEY_LAST_USED_AT)}`,
      ),
    ).toBeDefined();

    await act(async () => i18n.changeLanguage("ja"));

    expect(
      screen.getByText(
        `登録 ${formatDateTime("ja", PASSKEY_CREATED_AT)}・最終使用 ${formatDateTime("ja", PASSKEY_LAST_USED_AT)}`,
      ),
    ).toBeDefined();
  });

  test("名前の変更と削除のボタンは、見える文言をそのままに、名前でパスキーを見分けられる", async () => {
    const server = createPasskeyRoutes([
      { name: "MacBook", backedUp: true },
      { name: "iPhone", backedUp: true },
    ]);

    renderApp({ path: "/security", routes: server.routes });

    const [macbook, iphone] = await within(
      await screen.findByRole("main"),
    ).findAllByRole("listitem");

    expect(
      within(macbook!).getByRole("button", { name: "「MacBook」を削除" })
        .textContent,
    ).toBe("削除");
    expect(
      within(iphone!).getByRole("button", { name: "「iPhone」を削除" })
        .textContent,
    ).toBe("削除");
    expect(
      within(macbook!).getByRole("button", { name: "「MacBook」の名前を変更" })
        .textContent,
    ).toBe("名前を変更");
    expect(
      within(iphone!).getByRole("button", { name: "「iPhone」の名前を変更" })
        .textContent,
    ).toBe("名前を変更");
  });
});
