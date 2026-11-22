import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "bun:test";

import { createFixedPageRoutes } from "@/testing/fake-routes/create-fixed-page-routes";
import { kind, page } from "@/testing/fixed-page-samples";
import { renderApp } from "@/testing/render-app";

afterEach(cleanup);
const session = {
  "admin/session/get": () => ({
    output: { expiresAt: "2026-11-23T00:00:00.000Z" },
  }),
};
test("種類を読み込んでいる間と選べる種類が無いときの知らせを出す", async () => {
  const pending = Promise.withResolvers<undefined>();
  renderApp({
    path: "/fixed-pages/new",
    routes: {
      ...session,
      "admin/kinds/list": async () => {
        await pending.promise;
        return { output: { kinds: [] } };
      },
    },
  });
  expect(await screen.findByText("読み込んでいます。")).toBeDefined();
  pending.resolve(undefined);
  expect(
    await screen.findByRole("heading", { name: "選べる種類がありません" }),
  ).toBeDefined();
});
test("選んだ種類が無いときはフォームを出さずに知らせる", async () => {
  renderApp({
    path: "/fixed-pages/new?kind=missing",
    routes: { ...session, "admin/kinds/get": () => ({ error: "NOT_FOUND" }) },
  });
  expect(await screen.findByText("この種類はもうありません。")).toBeDefined();
  expect(screen.queryByRole("button", { name: "保存" })).toBeNull();
});
test("編集する固定ページが無いときは種類を取得しない", async () => {
  const { calls } = renderApp({
    path: "/fixed-pages/019affff-0000-7000-8000-000000000001",
    routes: {
      ...session,
      "admin/fixedPages/get": () => ({ error: "NOT_FOUND" }),
    },
  });
  expect(
    await screen.findByText("この固定ページはもうありません。"),
  ).toBeDefined();
  expect(calls).not.toContain("admin/kinds/get");
});
test("編集する固定ページを読み込めないときは失敗を知らせる", async () => {
  renderApp({
    path: "/fixed-pages/019affff-0000-7000-8000-000000000001",
    routes: {
      ...session,
      "admin/fixedPages/get": () => ({
        error: "INTERNAL_SERVER_ERROR",
        defined: false,
      }),
    },
  });
  expect(
    await screen.findByText("読み込めませんでした。", {}, { timeout: 5000 }),
  ).toBeDefined();
}, 10000);

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

test("ほかの画面から戻ると、前に読んだ値ではなく、読み直した固定ページでフォームを作る", async () => {
  let title = "前のタイトル";
  const { history } = renderApp({
    path: "/fixed-pages/" + page.id,
    routes: {
      ...session,
      "admin/kinds/get": () => ({ output: kind }),
      "admin/fixedPages/get": () => ({ output: { ...page, title } }),
    },
  });

  expect(
    (await screen.findByRole<HTMLInputElement>("textbox", { name: "タイトル" }))
      .value,
  ).toBe("前のタイトル");
  history.push("/");
  await screen.findByRole("heading", { name: "ホーム" });
  title = "ほかのタブで直したタイトル";
  history.push("/fixed-pages/" + page.id);

  expect(
    (await screen.findByRole<HTMLInputElement>("textbox", { name: "タイトル" }))
      .value,
  ).toBe("ほかのタブで直したタイトル");
});

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
  await user.click(screen.getByRole("button", { name: "保存" }));

  expect(await screen.findByText("固定ページを作成しました。")).toBeDefined();
  const [created] = server.pages();
  expect(created?.content).toEqual({ lead: "こんにちは" });
  await screen.findByRole("heading", { name: "固定ページを編集" });
  expect(history.location.pathname).toBe("/fixed-pages/" + String(created?.id));

  await user.click(screen.getByRole("link", { name: "固定ページの一覧" }));
  await screen.findByRole("row", { name: "紹介" });
  await user.click(screen.getByRole("button", { name: "編集" }));

  expect(
    (await screen.findByRole<HTMLInputElement>("textbox", { name: "リード文" }))
      .value,
  ).toBe("こんにちは");
});

test("保存した直後にほかの画面へ移って戻っても、保存した値でフォームを作る", async () => {
  const user = userEvent.setup();
  const server = createFixedPageRoutes({
    kinds: [{ name: "page", label: "基本のページ", fields: [] }],
    pages: [{ kind: "page", slug: "about", title: "Original" }],
  });
  const [stored] = server.pages();
  const { history } = renderApp({
    path: "/fixed-pages/" + String(stored?.id),
    routes: server.routes,
  });
  const title = await screen.findByRole("textbox", { name: "タイトル" });

  await user.clear(title);
  await user.type(title, "New title");
  await user.click(screen.getByRole("button", { name: "保存" }));
  await screen.findByText("固定ページを更新しました。");
  history.push("/");
  await screen.findByRole("heading", { name: "ホーム" });
  history.push("/fixed-pages/" + String(stored?.id));

  expect(
    (await screen.findByRole<HTMLInputElement>("textbox", { name: "タイトル" }))
      .value,
  ).toBe("New title");
});
