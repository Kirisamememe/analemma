import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "bun:test";

import { createFakeAuthenticator } from "../../../testing/create-fake-authenticator";
import { createPasskeyRoutes } from "../../../testing/create-passkey-routes";
import { renderApp } from "../../../testing/render-app";

afterEach(cleanup);

describe("PasskeysSection", () => {
  test("前の操作の知らせは、次の操作を始めると消す", async () => {
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
      (await screen.findAllByRole("button", { name: "消す" }))[0]!,
    );
    await userEvent.click(
      (await screen.findAllByRole("button", { name: "消す" })).at(-1)!,
    );

    expect(await screen.findByRole("status")).toBeDefined();

    await userEvent.click(
      screen.getByRole("button", { name: "パスキーを足す" }),
    );

    expect(screen.queryByRole("status")).toBeNull();
  });
});
