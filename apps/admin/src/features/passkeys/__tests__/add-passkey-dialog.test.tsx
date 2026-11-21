import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "bun:test";

import { createFakeAuthenticator } from "../../../testing/create-fake-authenticator";
import { createPasskeyRoutes } from "../../../testing/create-passkey-routes";
import { renderApp } from "../../../testing/render-app";

afterEach(cleanup);

const openAndSubmit = async (name: string): Promise<void> => {
  await userEvent.click(
    await screen.findByRole("button", { name: "パスキーを足す" }),
  );

  const dialog = await screen.findByRole("dialog", { name: "パスキーを足す" });

  await userEvent.type(
    screen.getByRole("textbox", { name: "パスキーの名前" }),
    name,
  );
  await userEvent.click(
    screen
      .getAllByRole("button", { name: "パスキーを足す" })
      .find((button) => dialog.contains(button))!,
  );
};

describe("AddPasskeyDialog", () => {
  test("確かめ直して足すと、画面を閉じ、一覧に出し、足したことを知らせる", async () => {
    const server = createPasskeyRoutes([
      { id: "passkey-1", name: "MacBook", backedUp: true },
    ]);
    const { calls } = renderApp({
      path: "/security",
      routes: server.routes,
      authenticator: createFakeAuthenticator(),
    });

    await openAndSubmit("iPhone");

    expect(await screen.findByText("iPhone")).toBeDefined();
    expect(screen.getByRole("status").textContent).toBe(
      "パスキーを足しました。",
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(calls).toContain("admin/session/reauthenticationOptions");
  });

  test("確かめ直せなければ、画面を開いたまま知らせる", async () => {
    const server = createPasskeyRoutes([
      { id: "passkey-1", name: "MacBook", backedUp: true },
    ]);

    server.failNext("admin/passkeys/register", {
      error: "REAUTHENTICATION_FAILED",
      status: 403,
    });
    renderApp({
      path: "/security",
      routes: server.routes,
      authenticator: createFakeAuthenticator(),
    });

    await openAndSubmit("iPhone");

    expect((await screen.findByRole("alert")).textContent).toBe(
      "今のパスキーで確かめられませんでした。",
    );
    expect(screen.getByRole("dialog")).toBeDefined();
    expect(server.passkeys()).toHaveLength(1);
  });
});
