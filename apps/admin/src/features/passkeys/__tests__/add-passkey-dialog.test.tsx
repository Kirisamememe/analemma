import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "bun:test";

import { createFakeAuthenticator } from "../../../testing/create-fake-authenticator";
import { createPasskeyRoutes } from "../../../testing/create-passkey-routes";
import { renderApp } from "../../../testing/render-app";

afterEach(cleanup);

const openAndSubmit = async (name: string): Promise<void> => {
  await userEvent.click(
    await screen.findByRole("button", { name: "パスキーを追加" }),
  );

  const dialog = await screen.findByRole("dialog", { name: "パスキーを追加" });

  await userEvent.type(
    screen.getByRole("textbox", { name: "パスキーの名前" }),
    name,
  );
  await userEvent.click(
    screen
      .getAllByRole("button", { name: "パスキーを追加" })
      .find((button) => dialog.contains(button))!,
  );
};

describe("AddPasskeyDialog", () => {
  test("再認証をして追加すると、Dialog を閉じ、一覧に出し、Toast で知らせる", async () => {
    const server = createPasskeyRoutes([{ name: "MacBook", backedUp: true }]);
    const { calls } = renderApp({
      path: "/security",
      routes: server.routes,
      authenticator: createFakeAuthenticator(),
    });

    await openAndSubmit("iPhone");

    expect(await screen.findByText("iPhone")).toBeDefined();
    expect((await screen.findByRole("alert")).textContent).toBe(
      "パスキーを追加しました。",
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(calls).toContain("admin/session/reauthenticationOptions");
  });

  test("再認証ができなければ、Dialog を開いたまま知らせる", async () => {
    const server = createPasskeyRoutes([{ name: "MacBook", backedUp: true }]);

    server.replyNext("admin/passkeys/register", () => ({
      error: "REAUTHENTICATION_FAILED",
    }));
    renderApp({
      path: "/security",
      routes: server.routes,
      authenticator: createFakeAuthenticator(),
    });

    await openAndSubmit("iPhone");

    expect((await screen.findByRole("alert")).textContent).toBe(
      "本人確認ができませんでした。",
    );
    expect(screen.getByRole("dialog")).toBeDefined();
    expect(server.passkeys()).toHaveLength(1);
  });

  test("失敗してから閉じて開き直すと、前の失敗の知らせは出さない", async () => {
    const server = createPasskeyRoutes([{ name: "MacBook", backedUp: true }]);

    server.replyNext("admin/passkeys/register", () => ({
      error: "REAUTHENTICATION_FAILED",
    }));
    renderApp({
      path: "/security",
      routes: server.routes,
      authenticator: createFakeAuthenticator(),
    });

    await openAndSubmit("iPhone");
    await screen.findByRole("alert");
    await userEvent.click(screen.getByRole("button", { name: "キャンセル" }));
    await userEvent.click(
      await screen.findByRole("button", { name: "パスキーを追加" }),
    );
    await screen.findByRole("dialog");

    expect(screen.queryByRole("alert")).toBeNull();
  });

  test("最初の一覧の取得が遅れて届いても、追加したパスキーを一覧に出す", async () => {
    const server = createPasskeyRoutes([{ name: "MacBook", backedUp: true }]);
    const slow = Promise.withResolvers<undefined>();
    const original = server.routes["admin/passkeys/list"];

    server.replyNext("admin/passkeys/list", async () => {
      const before = original(undefined);

      await slow.promise;

      return before;
    });
    renderApp({
      path: "/security",
      routes: server.routes,
      authenticator: createFakeAuthenticator(),
    });

    await openAndSubmit("iPhone");
    slow.resolve(undefined);

    expect(await screen.findByText("iPhone")).toBeDefined();
  });
});
