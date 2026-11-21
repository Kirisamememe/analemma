import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "bun:test";

import { createFakeApi } from "../../../testing/create-fake-api";
import { FAKE_ASSERTION } from "../../../testing/create-fake-authenticator";
import { createPasskeyRoutes } from "../../../testing/create-passkey-routes";
import { renderApp } from "../../../testing/render-app";

afterEach(cleanup);

const renameTo = async (name: string): Promise<void> => {
  await userEvent.click(
    await screen.findByRole("button", { name: "名前を変える" }),
  );

  const field = await screen.findByRole("textbox", { name: "パスキーの名前" });

  await userEvent.clear(field);
  await userEvent.type(field, name);
  await userEvent.click(screen.getByRole("button", { name: "保存" }));
};

describe("RenamePasskeyDialog", () => {
  test("今の名前を入れて開き、変えると一覧に出す", async () => {
    const server = createPasskeyRoutes([{ name: "MacBook", backedUp: true }]);

    renderApp({ path: "/security", routes: server.routes });

    await userEvent.click(
      await screen.findByRole("button", { name: "名前を変える" }),
    );

    expect(
      (
        await screen.findByRole<HTMLInputElement>("textbox", {
          name: "パスキーの名前",
        })
      ).value,
    ).toBe("MacBook");

    await userEvent.click(screen.getByRole("button", { name: "やめる" }));
    await renameTo("Mac mini");

    expect(await screen.findByText("Mac mini")).toBeDefined();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  test("もう無いパスキーなら、画面を開いたまま知らせる", async () => {
    const server = createPasskeyRoutes([{ name: "MacBook", backedUp: true }]);

    server.replyNext("admin/passkeys/rename", () => ({
      error: "NOT_FOUND",
      status: 404,
    }));
    renderApp({ path: "/security", routes: server.routes });

    await renameTo("Mac mini");

    expect(
      await screen.findByText("このパスキーはもうありません。"),
    ).toBeDefined();
    expect(screen.getByRole("dialog")).toBeDefined();
  });

  test("名前を変えたら、そのことを知らせる", async () => {
    const server = createPasskeyRoutes([{ name: "MacBook", backedUp: true }]);

    renderApp({ path: "/security", routes: server.routes });

    await renameTo("Mac mini");

    expect((await screen.findByRole("status")).textContent).toBe(
      "パスキーの名前を変えました。",
    );
  });

  test("もう無いパスキーの画面を閉じたら、「パスキーを足す」に focus を移す", async () => {
    const server = createPasskeyRoutes([
      { name: "MacBook", backedUp: true },
      { name: "iPhone", backedUp: true },
    ]);
    const { api } = createFakeApi(server.routes);

    renderApp({ path: "/security", routes: server.routes });

    await userEvent.click(
      (await screen.findAllByRole("button", { name: "名前を変える" }))[0]!,
    );
    await screen.findByRole("dialog");
    await api.admin.session.reauthenticationOptions();
    await api.admin.passkeys.delete({ id: "pk1", assertion: FAKE_ASSERTION });
    await userEvent.click(screen.getByRole("button", { name: "保存" }));
    await screen.findByText("このパスキーはもうありません。");
    await userEvent.click(screen.getByRole("button", { name: "やめる" }));
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });

    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "パスキーを足す" }),
    );
  });

  test("名前を変えた後に一覧を読み込めなければ、「パスキーを足す」に focus を移す", async () => {
    const server = createPasskeyRoutes([{ name: "MacBook", backedUp: true }]);
    const list = server.routes["admin/passkeys/list"]!;
    let isListBroken = false;

    renderApp({
      path: "/security",
      routes: {
        ...server.routes,
        "admin/passkeys/list": async (input) =>
          isListBroken
            ? {
                error: "INTERNAL_SERVER_ERROR",
                status: 500,
                defined: false,
              }
            : list(input),
      },
    });

    await screen.findByRole("button", { name: "名前を変える" });
    isListBroken = true;
    await renameTo("Mac mini");
    await screen.findByText(
      "パスキーを読み込めませんでした。",
      {},
      { timeout: 5000 },
    );
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });

    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "パスキーを足す" }),
    );
  }, 10_000);
});
