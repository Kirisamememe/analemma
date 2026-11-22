import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "bun:test";

import { createFakeAuthenticator } from "@/testing/create-fake-authenticator";
import { createPasskeyRoutes } from "@/testing/fake-routes/create-passkey-routes";
import { renderApp } from "@/testing/render-app";

afterEach(cleanup);

const confirmDelete = async (): Promise<void> => {
  await userEvent.click(
    (await screen.findAllByRole("button", { name: "削除" }))[0]!,
  );

  const dialog = await screen.findByRole("dialog", {
    name: "「MacBook」を削除しますか?",
  });

  await userEvent.click(within(dialog).getByRole("button", { name: "削除" }));
};

describe("DeletePasskeyDialog", () => {
  test("再認証をして削除すると、Dialog を閉じ、一覧から外し、Toast で知らせる", async () => {
    const server = createPasskeyRoutes([
      { name: "MacBook", backedUp: true },
      { name: "iPhone", backedUp: true },
    ]);

    renderApp({
      path: "/security",
      routes: server.routes,
      authenticator: createFakeAuthenticator(),
    });

    await confirmDelete();

    expect((await screen.findByRole("alert")).textContent).toBe(
      "パスキーを削除しました。ほかのブラウザからはログアウトしました。",
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByText("MacBook")).toBeNull();
    expect(server.passkeys().map(({ name }) => name)).toEqual(["iPhone"]);
  });

  test("最後のパスキーは削除できないことを、Dialog を開いたまま知らせる", async () => {
    const server = createPasskeyRoutes([{ name: "MacBook", backedUp: true }]);
    renderApp({
      path: "/security",
      routes: server.routes,
      authenticator: createFakeAuthenticator(),
    });

    await confirmDelete();

    expect((await screen.findByRole("alert")).textContent).toBe(
      "最後のパスキーは削除できません。",
    );
    expect(screen.getByRole("dialog")).toBeDefined();
  });

  test("失敗してから閉じて開き直すと、前の失敗の知らせは出さない", async () => {
    const server = createPasskeyRoutes([{ name: "MacBook", backedUp: true }]);
    renderApp({
      path: "/security",
      routes: server.routes,
      authenticator: createFakeAuthenticator(),
    });

    await confirmDelete();
    await screen.findByRole("alert");
    await userEvent.click(screen.getByRole("button", { name: "キャンセル" }));
    await userEvent.click(
      (await screen.findAllByRole("button", { name: "削除" }))[0]!,
    );
    await screen.findByRole("dialog");

    expect(screen.queryByRole("alert")).toBeNull();
  });

  test("再認証をキャンセルしたら、削除せずに知らせる", async () => {
    const server = createPasskeyRoutes([{ name: "MacBook", backedUp: true }]);

    renderApp({
      path: "/security",
      routes: server.routes,
      authenticator: createFakeAuthenticator({
        authenticate: { _tag: "Cancelled" },
      }),
    });

    await confirmDelete();

    expect(
      await screen.findByText("パスキーの操作をキャンセルしました。"),
    ).toBeDefined();
    expect(server.passkeys()).toHaveLength(1);
  });

  test("削除した後は、消えた行の代わりに「パスキーを追加」に focus を移す", async () => {
    const server = createPasskeyRoutes([
      { name: "MacBook", backedUp: true },
      { name: "iPhone", backedUp: true },
    ]);

    renderApp({
      path: "/security",
      routes: server.routes,
      authenticator: createFakeAuthenticator(),
    });

    await confirmDelete();
    await screen.findByRole("alert");
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });

    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "パスキーを追加" }),
    );
  });
});
