import { act, cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "bun:test";

import { createFixedPageRoutes } from "@/testing/fake-routes/create-fixed-page-routes";
import { kind } from "@/testing/fixed-page-samples";
import { renderApp } from "@/testing/render-app";

afterEach(cleanup);

const clickSave = async (user: ReturnType<typeof userEvent.setup>) => {
  const [save] = screen.getAllByRole("button", { name: "保存" });

  if (save === undefined) throw new Error("保存のボタンがありません");

  await user.click(save);
};

const session = {
  "admin/session/get": () => ({
    output: { expiresAt: "2026-11-23T00:00:00.000Z" },
  }),
};

test.each(["true", "false", "null"])(
  "種類名 %s を URL から文字列として取得する",
  async (name) => {
    let received: unknown;
    renderApp({
      path: "/fixed-pages/new?kind=" + name,
      routes: {
        ...session,
        "admin/kinds/get": (input) => {
          received = input;
          return { error: "NOT_FOUND" };
        },
      },
    });
    expect(await screen.findByText("この種類はもうありません。")).toBeDefined();
    expect(received).toEqual({ name });
  },
);

test("一覧から種類を選んで作り、編集の画面から一覧に戻って、作ったページを編集で開ける", async () => {
  const user = userEvent.setup();

  const server = createFixedPageRoutes({
    kinds: [
      {
        name: "about",
        label: "About",
        fields: [{ key: "lead", type: "text", label: "リード文" }],
      },
    ],
  });

  const { history } = renderApp({
    path: "/fixed-pages",
    routes: server.routes,
  });

  await user.click(
    await screen.findByRole("button", { name: "新しい固定ページ" }),
  );
  await user.click(await screen.findByRole("button", { name: "About" }));
  await user.type(
    await screen.findByRole("textbox", { name: "slug" }),
    "about",
  );
  await user.type(screen.getByRole("textbox", { name: "タイトル" }), "紹介");
  await user.type(
    screen.getByRole("textbox", { name: "リード文" }),
    "こんにちは",
  );
  await clickSave(user);

  const saved = await screen.findByRole("dialog", {
    name: "固定ページを作成しました。",
  });

  await user.click(within(saved).getByRole("button", { name: "閉じる" }));
  const [created] = server.pages();
  expect(created?.content).toEqual({ lead: "こんにちは" });
  await screen.findByRole("heading", { name: "固定ページを編集" });
  expect(history.location.pathname).toBe("/fixed-pages/" + String(created?.id));

  await user.click(screen.getByRole("link", { name: "固定ページの一覧" }));
  await screen.findByRole("row", { name: "紹介" });
  await user.click(screen.getByRole("button", { name: "「紹介」を編集" }));

  expect(
    (await screen.findByRole<HTMLInputElement>("textbox", { name: "リード文" }))
      .value,
  ).toBe("こんにちは");
});

test("種類を選んだ後、読み込む間にほかへ移した focus は、作成のフォームを出しても slug へ移さない", async () => {
  const loading = Promise.withResolvers<undefined>();

  renderApp({
    path: "/fixed-pages/new",
    routes: {
      ...session,
      "admin/kinds/list": () => ({ output: { kinds: [kind] } }),
      "admin/kinds/get": async () => {
        await loading.promise;

        return { output: kind };
      },
    },
  });

  await userEvent.click(await screen.findByRole("button", { name: "紹介" }));
  await screen.findByText("読み込んでいます");

  const ready = screen
    .getAllByRole("status")
    .find((status) => status.textContent === "");

  expect(ready).toBeDefined();
  const back = screen.getByRole("link", { name: "固定ページの一覧" });

  act(() => {
    back.focus();
  });
  loading.resolve(undefined);
  await screen.findByRole("textbox", { name: "slug" });

  expect(ready?.textContent).toBe("作成フォームを表示しました。");
  expect(document.activeElement).toBe(back);
});
