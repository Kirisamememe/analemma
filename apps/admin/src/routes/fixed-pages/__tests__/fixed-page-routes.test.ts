import { act, cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "bun:test";

import { type FakeReply, wrapFakeRoute } from "@/testing/create-fake-api";
import { createFixedPageRoutes } from "@/testing/fake-routes/create-fixed-page-routes";
import { kind, page } from "@/testing/fixed-page-samples";
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
  expect(await screen.findByText("読み込んでいます")).toBeDefined();
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
test("種類の読み込みに失敗しても、取得した固定ページを確認して削除できる", async () => {
  const server = createFixedPageRoutes({ kinds: [kind], pages: [page] });
  const [target] = server.pages();

  if (target === undefined) throw new Error("固定ページがありません");

  renderApp({
    path: "/fixed-pages/" + target.id,
    routes: {
      ...server.routes,
      "admin/kinds/get": () => ({
        error: "INTERNAL_SERVER_ERROR",
        defined: false,
      }),
    },
  });
  const alert = await screen.findByRole("alert", {}, { timeout: 5000 });

  expect(
    within(alert).getByRole("heading", {
      name: "種類の定義を読み込めませんでした",
    }),
  ).toBeDefined();
  expect(
    within(alert).getByText(
      "中身の項目は、種類の定義から作ります。接続を確かめてから、もう一度試してください。",
    ),
  ).toBeDefined();
  await userEvent.click(
    screen.getByRole("button", { name: "固定ページを削除" }),
  );

  const dialog = await screen.findByRole("dialog", {
    name: "「紹介」を削除しますか?",
  });

  await userEvent.click(within(dialog).getByRole("button", { name: "削除" }));
  await screen.findByRole("heading", { name: "固定ページはまだありません" });
  expect(server.pages()).toHaveLength(0);
}, 10000);
test("種類の定義を読み込めなければ、もう一度試すと、取り直す間は削除を止め、取れたら編集のフォームを出す", async () => {
  const server = createFixedPageRoutes({ kinds: [kind], pages: [page] });
  const [target] = server.pages();
  const get = server.routes["admin/kinds/get"];
  const held = Promise.withResolvers<FakeReply<"admin/kinds/get">>();
  let isBroken = true;

  if (target === undefined) throw new Error("固定ページがありません");

  renderApp({
    path: "/fixed-pages/" + target.id,
    routes: {
      ...server.routes,
      "admin/kinds/get": wrapFakeRoute(get, async () =>
        isBroken
          ? { error: "INTERNAL_SERVER_ERROR", defined: false }
          : held.promise,
      ),
    },
  });
  await screen.findByRole("alert", {}, { timeout: 5000 });
  isBroken = false;
  await userEvent.click(screen.getByRole("button", { name: "もう一度試す" }));

  expect(
    screen
      .getByRole("button", { name: "固定ページを削除" })
      .hasAttribute("disabled"),
  ).toBe(true);

  held.resolve(get({ name: kind.name }));

  expect(
    await screen.findByRole("textbox", { name: /タイトル/v }),
  ).toBeDefined();
  expect(screen.queryByRole("alert")).toBeNull();
}, 10000);
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
    await screen.findByRole(
      "heading",
      { level: 2, name: "固定ページを読み込めませんでした" },
      { timeout: 5000 },
    ),
  ).toBeDefined();
  expect(screen.getByRole("button", { name: "もう一度試す" })).toBeDefined();
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
  await clickSave(user);

  expect(await screen.findByText("固定ページを作成しました。")).toBeDefined();
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
  await clickSave(user);
  await screen.findByText("固定ページを更新しました。");
  history.push("/");
  await screen.findByRole("heading", { name: "ホーム" });
  history.push("/fixed-pages/" + String(stored?.id));

  expect(
    (await screen.findByRole<HTMLInputElement>("textbox", { name: "タイトル" }))
      .value,
  ).toBe("New title");
});

test("保存の応答を待つ間に画面を離れたら、届いた応答を残さず、開き直したときに読み直す", async () => {
  const user = userEvent.setup();
  const saving = Promise.withResolvers<undefined>();
  const reloading = Promise.withResolvers<undefined>();

  const server = createFixedPageRoutes({
    kinds: [{ name: "page", label: "基本のページ", fields: [] }],
    pages: [{ kind: "page", slug: "about", title: "Original" }],
  });

  const [stored] = server.pages();
  const id = String(stored?.id);
  const update = server.routes["admin/fixedPages/update"];
  const get = server.routes["admin/fixedPages/get"];
  let gets = 0;

  const { history } = renderApp({
    path: "/fixed-pages/" + id,
    routes: {
      ...server.routes,
      "admin/fixedPages/get": async (input) => {
        gets += 1;

        if (gets > 1) await reloading.promise;

        return get(input);
      },
      "admin/fixedPages/update": async (input) => {
        await saving.promise;

        return update(input);
      },
    },
  });

  const title = await screen.findByRole("textbox", { name: "タイトル" });

  await user.clear(title);
  await user.type(title, "Saved");
  await clickSave(user);
  history.push("/");
  await user.click(
    within(
      await screen.findByRole("dialog", {
        name: "保存していない変更があります",
      }),
    ).getByRole("button", { name: "変更を破棄" }),
  );
  await screen.findByRole("heading", { name: "ホーム" });
  saving.resolve(undefined);
  await waitFor(() => {
    expect(server.pages()[0]?.title).toBe("Saved");
  });
  update({ id, slug: "about", title: "Other tab", content: {} });
  history.push("/fixed-pages/" + id);
  await waitFor(() => {
    expect(gets).toBe(2);
  });
  reloading.resolve(undefined);

  expect(
    (await screen.findByRole<HTMLInputElement>("textbox", { name: "タイトル" }))
      .value,
  ).toBe("Other tab");
});

test("読み込む間に一覧へ戻るリンクへ移した focus を、編集のフォームを出した後も残す", async () => {
  const loading = Promise.withResolvers<undefined>();

  renderApp({
    path: "/fixed-pages/" + page.id,
    routes: {
      ...session,
      "admin/fixedPages/get": () => ({ output: page }),
      "admin/kinds/get": async () => {
        await loading.promise;

        return { output: kind };
      },
    },
  });

  await screen.findByText("読み込んでいます");
  const back = screen.getByRole("link", { name: "固定ページの一覧" });

  act(() => {
    back.focus();
  });
  loading.resolve(undefined);
  await screen.findByRole("textbox", { name: "タイトル" });

  expect(
    screen.getByText("編集フォームを表示しました。").getAttribute("aria-live"),
  ).toBe("polite");
  expect(document.activeElement).toBe(back);
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
