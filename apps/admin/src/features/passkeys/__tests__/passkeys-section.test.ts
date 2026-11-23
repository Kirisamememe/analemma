import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "bun:test";

import { createFakeAuthenticator } from "@/testing/create-fake-authenticator";
import { createPasskeyRoutes } from "@/testing/fake-routes/create-passkey-routes";
import { renderApp } from "@/testing/render-app";

afterEach(cleanup);

describe("PasskeysSection", () => {
  test("次の Dialog を開いても、前の操作の Toast は残る", async () => {
    const server = createPasskeyRoutes([
      { name: "MacBook", backedUp: true },
      { name: "iPhone", backedUp: true },
    ]);

    renderApp({
      path: "/security",
      routes: server.routes,
      authenticator: createFakeAuthenticator(),
    });

    await userEvent.click(
      (await screen.findAllByRole("button", { name: "削除" }))[0]!,
    );
    const dialog = await screen.findByRole("dialog", {
      name: "「MacBook」を削除しますか?",
    });
    await userEvent.click(within(dialog).getByRole("button", { name: "削除" }));
    await screen.findByRole("alert");

    await userEvent.click(
      screen.getByRole("button", { name: "パスキーを追加" }),
    );

    await screen.findByRole("dialog", { name: "パスキーを追加" });
    expect(screen.getByRole("alert").textContent).toBe(
      "パスキーを削除しました。ほかのブラウザからはログアウトしました。",
    );
  });
});
