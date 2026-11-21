import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "bun:test";

import { createFakeAuthenticator } from "../../../testing/create-fake-authenticator";
import { createPasskeyRoutes } from "../../../testing/create-passkey-routes";
import { renderApp } from "../../../testing/render-app";

afterEach(cleanup);

const confirmDelete = async (): Promise<void> => {
  await userEvent.click(
    (await screen.findAllByRole("button", { name: "消す" }))[0]!,
  );

  const dialog = await screen.findByRole("dialog", {
    name: "「MacBook」を消しますか?",
  });

  await userEvent.click(within(dialog).getByRole("button", { name: "消す" }));
};

describe("DeletePasskeyDialog", () => {
  test("確かめ直して消すと、一覧から外し、ほかのブラウザのログインが終わったことを知らせる", async () => {
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

    expect((await screen.findByRole("status")).textContent).toBe(
      "パスキーを消しました。ほかのブラウザのログインは終わりました。",
    );
    expect(screen.queryByText("MacBook")).toBeNull();
    expect(server.passkeys().map(({ name }) => name)).toEqual(["iPhone"]);
  });

  test("最後のパスキーは消せないことを、画面を開いたまま知らせる", async () => {
    const server = createPasskeyRoutes([{ name: "MacBook", backedUp: true }]);
    renderApp({
      path: "/security",
      routes: server.routes,
      authenticator: createFakeAuthenticator(),
    });

    await confirmDelete();

    expect((await screen.findByRole("alert")).textContent).toBe(
      "最後のパスキーは消せません。",
    );
    expect(screen.getByRole("dialog")).toBeDefined();
  });

  test("確かめ直しを取り消したら、消さずに知らせる", async () => {
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
      await screen.findByText("パスキーの操作を取り消しました。"),
    ).toBeDefined();
    expect(server.passkeys()).toHaveLength(1);
  });

  test("消した後は、消えた行の代わりに「パスキーを足す」に focus を移す", async () => {
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
    await screen.findByRole("status");
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });

    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "パスキーを足す" }),
    );
  });
});
