import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "bun:test";

import { createFixedPageRoutes } from "@/testing/fake-routes/create-fixed-page-routes";
import { renderApp } from "@/testing/render-app";

afterEach(cleanup);

const setUp = (opens: "list" | "editor") => {
  const server = createFixedPageRoutes({
    kinds: [{ name: "page", label: "基本のページ", fields: [] }],
    pages: [
      { kind: "page", slug: "about", title: "About", published: true },
      { kind: "page", slug: "colophon", title: "Colophon" },
    ],
  });

  const [about] = server.pages();

  const app = renderApp({
    path:
      opens === "list" ? "/fixed-pages" : "/fixed-pages/" + String(about?.id),
    routes: server.routes,
  });

  return { server, id: String(about?.id), ...app };
};

const openDelete = async (): Promise<HTMLElement> => {
  await userEvent.click(
    await screen.findByRole("button", { name: "固定ページを削除" }),
  );

  return screen.findByRole("dialog", { name: "「About」を削除しますか?" });
};

describe("DeleteFixedPage", () => {
  test("一覧の行には削除を置かず、編集の画面にだけ置く", async () => {
    setUp("list");

    const row = await screen.findByRole("row", { name: "About" });

    expect(within(row).queryByRole("button", { name: /削除/v })).toBeNull();
  });

  test("タイトルを見せて確かめ、削除したら一覧に戻り、Toast で知らせる", async () => {
    const { server, history } = setUp("editor");
    const dialog = await openDelete();

    await userEvent.click(within(dialog).getByRole("button", { name: "削除" }));

    expect((await screen.findByRole("alert")).textContent).toBe(
      "「About」を削除しました。",
    );
    await waitFor(() => {
      expect(history.location.pathname).toBe("/fixed-pages");
    });
    expect(await screen.findByRole("row", { name: "Colophon" })).toBeDefined();
    expect(screen.queryByRole("row", { name: "About" })).toBeNull();
    expect(server.pages().map(({ slug }) => slug)).toEqual(["colophon"]);
  });

  test("一覧を読んだ後に開いても、戻った一覧に削除したページを一瞬も出さない", async () => {
    const { server, history, id } = setUp("list");
    const listing = Promise.withResolvers<undefined>();

    await screen.findByRole("row", { name: "About" });
    history.push("/fixed-pages/" + id);
    const dialog = await openDelete();

    server.replyNext("admin/fixedPages/list", async () => {
      await listing.promise;

      return server.routes["admin/fixedPages/list"](undefined);
    });
    await userEvent.click(within(dialog).getByRole("button", { name: "削除" }));
    await waitFor(() => {
      expect(server.pages()).toHaveLength(1);
    });

    expect(screen.queryByRole("row", { name: "About" })).toBeNull();
    listing.resolve(undefined);
    expect(await screen.findByRole("row", { name: "Colophon" })).toBeDefined();
    expect(screen.queryByRole("row", { name: "About" })).toBeNull();
  });

  test("値を変えたままでも、削除したら確かめずに一覧に戻る", async () => {
    const { history } = setUp("editor");

    await userEvent.type(
      await screen.findByRole("textbox", { name: "タイトル" }),
      "の続き",
    );
    await userEvent.click(
      within(await openDelete()).getByRole("button", { name: "削除" }),
    );

    await waitFor(() => {
      expect(history.location.pathname).toBe("/fixed-pages");
    });
    expect(
      screen.queryByRole("dialog", { name: "保存していない変更があります" }),
    ).toBeNull();
  });

  test("応答を待つ間にほかの画面へ移っていたら、削除できても一覧へは移らない", async () => {
    const { server, history, id } = setUp("editor");
    const deleting = Promise.withResolvers<undefined>();
    const dialog = await openDelete();

    server.replyNext("admin/fixedPages/delete", async () => {
      await deleting.promise;

      return server.routes["admin/fixedPages/delete"]({ id });
    });
    await userEvent.click(within(dialog).getByRole("button", { name: "削除" }));
    history.push("/");
    await screen.findByRole("heading", { name: "ホーム" });
    deleting.resolve(undefined);

    expect((await screen.findByRole("alert")).textContent).toBe(
      "「About」を削除しました。",
    );
    expect(history.location.pathname).toBe("/");
  });

  test("キャンセルしたら、削除しない", async () => {
    const { server, calls, history, id } = setUp("editor");
    const dialog = await openDelete();

    await userEvent.click(
      within(dialog).getByRole("button", { name: "キャンセル" }),
    );

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
    expect(calls).not.toContain("admin/fixedPages/delete");
    expect(server.pages()).toHaveLength(2);
    expect(history.location.pathname).toBe("/fixed-pages/" + id);
  });

  test("ほかで消えていたら、Dialog の中で知らせ、削除のボタンを止める", async () => {
    const { server, id } = setUp("editor");
    const dialog = await openDelete();

    server.routes["admin/fixedPages/delete"]({ id });
    await userEvent.click(within(dialog).getByRole("button", { name: "削除" }));

    expect(
      await within(dialog).findByText("この固定ページはもうありません。"),
    ).toBeDefined();
    expect(
      within(dialog)
        .getByRole("button", { name: "削除" })
        .hasAttribute("disabled"),
    ).toBe(true);
  });

  test("削除できなければ、Dialog を開いたまま知らせ、開き直すと知らせを消す", async () => {
    const { server } = setUp("editor");
    const dialog = await openDelete();

    server.replyNext("admin/fixedPages/delete", () => ({
      error: "INTERNAL_SERVER_ERROR",
      defined: false,
    }));
    await userEvent.click(within(dialog).getByRole("button", { name: "削除" }));

    expect((await within(dialog).findByRole("alert")).textContent).toBe(
      "固定ページを削除できませんでした。もう一度試してください。",
    );
    expect(server.pages()).toHaveLength(2);

    await userEvent.click(
      within(dialog).getByRole("button", { name: "キャンセル" }),
    );
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    expect(within(await openDelete()).queryByRole("alert")).toBeNull();
  });
});
