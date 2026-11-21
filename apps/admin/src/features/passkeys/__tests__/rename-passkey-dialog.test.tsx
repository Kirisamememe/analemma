import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "bun:test";

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
});
