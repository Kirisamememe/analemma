import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "bun:test";

import { createFixedPageRoutes } from "@/testing/fake-routes/create-fixed-page-routes";
import { renderApp } from "@/testing/render-app";

afterEach(cleanup);

const setUp = () => {
  const server = createFixedPageRoutes({
    kinds: [{ name: "page", label: "基本のページ", fields: [] }],
    pages: [
      { kind: "page", slug: "about", title: "About", published: true },
      { kind: "page", slug: "colophon", title: "Colophon" },
    ],
  });
  const app = renderApp({ path: "/fixed-pages", routes: server.routes });

  return { server, ...app };
};

const openDelete = async (title: string): Promise<HTMLElement> => {
  await userEvent.click(
    within(await screen.findByRole("row", { name: title })).getByRole(
      "button",
      { name: "削除" },
    ),
  );

  return screen.findByRole("dialog", { name: `「${title}」を削除しますか?` });
};

describe("DeleteFixedPageDialog", () => {
  test("タイトルを見せて確かめ、削除したら行を消して Toast で知らせる", async () => {
    const { server } = setUp();
    const dialog = await openDelete("About");

    await userEvent.click(within(dialog).getByRole("button", { name: "削除" }));

    expect((await screen.findByRole("alert")).textContent).toBe(
      "「About」を削除しました。",
    );
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
    expect(screen.queryByRole("row", { name: "About" })).toBeNull();
    expect(server.pages().map(({ slug }) => slug)).toEqual(["colophon"]);
  });

  test("キャンセルしたら、削除しない", async () => {
    const { server, calls } = setUp();
    const dialog = await openDelete("Colophon");

    await userEvent.click(
      within(dialog).getByRole("button", { name: "キャンセル" }),
    );

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
    expect(calls).not.toContain("admin/fixedPages/delete");
    expect(server.pages()).toHaveLength(2);
  });

  test("ほかで消えていたら、Dialog の中で知らせ、一覧を取り直す", async () => {
    const { server } = setUp();
    const dialog = await openDelete("About");
    const [about] = server.pages();

    server.routes["admin/fixedPages/delete"]({ id: about?.id ?? "" });
    await userEvent.click(within(dialog).getByRole("button", { name: "削除" }));

    expect(
      await within(dialog).findByText(
        "この固定ページはもうありません。一覧を読み込み直しました。",
      ),
    ).toBeDefined();
    expect(
      within(dialog)
        .getByRole("button", { name: "削除" })
        .hasAttribute("disabled"),
    ).toBe(true);
    await waitFor(() => {
      expect(screen.queryByRole("row", { name: "About" })).toBeNull();
    });
  });

  test("削除できてから応答だけが失敗しても、一覧を取り直す", async () => {
    const { server } = setUp();
    const dialog = await openDelete("About");
    const [about] = server.pages();

    server.replyNext("admin/fixedPages/delete", () => {
      server.routes["admin/fixedPages/delete"]({ id: about?.id ?? "" });

      return { error: "INTERNAL_SERVER_ERROR", defined: false };
    });
    await userEvent.click(within(dialog).getByRole("button", { name: "削除" }));

    expect((await within(dialog).findByRole("alert")).textContent).toBe(
      "固定ページを削除できませんでした。もう一度試してください。",
    );
    await waitFor(() => {
      expect(screen.queryByRole("row", { name: "About" })).toBeNull();
    });
  });

  test("削除できなければ、Dialog を開いたまま知らせる", async () => {
    const { server } = setUp();
    const dialog = await openDelete("About");

    server.replyNext("admin/fixedPages/delete", () => ({
      error: "INTERNAL_SERVER_ERROR",
      defined: false,
    }));
    await userEvent.click(within(dialog).getByRole("button", { name: "削除" }));

    expect((await within(dialog).findByRole("alert")).textContent).toBe(
      "固定ページを削除できませんでした。もう一度試してください。",
    );
    expect(server.pages()).toHaveLength(2);
  });
});
