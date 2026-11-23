import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "bun:test";

import { fieldDefinitions } from "@analemma/contract";

import type { FakeRoutes } from "@/testing/create-fake-api";
import { kind, page } from "@/testing/fixed-page-samples";
import { renderApp } from "@/testing/render-app";

afterEach(cleanup);

const routes = {
  "admin/session/get": () => ({ output: { expiresAt: page.createdAt } }),
  "admin/kinds/get": () => ({ output: kind }),
  "admin/fixedPages/get": () => ({ output: page }),
} satisfies FakeRoutes;
const edit = (overrides: FakeRoutes) =>
  renderApp({
    path: "/fixed-pages/" + page.id,
    routes: { ...routes, ...overrides },
  });
const save = async (position: "top" | "bottom" = "top") => {
  const buttons = await screen.findAllByRole("button", { name: "保存" });
  const button = position === "top" ? buttons.at(0) : buttons.at(-1);

  if (button === undefined) throw new Error("保存のボタンがありません");

  await userEvent.click(button);
};

test("種類を選んで作成し、送信中の二重送信を防ぎ、履歴を置き換えて編集画面を開く", async () => {
  const pending = Promise.withResolvers<undefined>();
  let sent: unknown;
  const { history, calls } = renderApp({
    path: "/fixed-pages/new",
    routes: {
      ...routes,
      "admin/kinds/list": () => ({ output: { kinds: [kind] } }),
      "admin/fixedPages/create": async (input) => {
        sent = input;
        await pending.promise;

        return { output: page };
      },
    },
  });
  await userEvent.click(await screen.findByRole("button", { name: "紹介" }));
  await userEvent.type(
    await screen.findByRole("textbox", { name: "slug" }),
    "about",
  );
  await userEvent.type(
    screen.getByRole("textbox", { name: "タイトル" }),
    "紹介",
  );
  const length = history.length;
  await save();
  await screen.findAllByRole("progressbar");

  for (const button of screen.getAllByRole("button", { name: /保存/v })) {
    await userEvent.click(button);
  }

  await userEvent.keyboard("{Enter}");
  expect(
    calls.filter((path) => path === "admin/fixedPages/create"),
  ).toHaveLength(1);
  expect(sent).toEqual({
    kind: "profile",
    slug: "about",
    title: "紹介",
    content: {},
  });
  pending.resolve(undefined);
  await screen.findByRole("heading", { name: "固定ページを編集" });
  expect(history.location.pathname).toBe("/fixed-pages/" + page.id);
  expect(history.length).toBe(length);
  expect(await screen.findByText("固定ページを作成しました。")).toBeDefined();
});

test("行を動かし、追加・削除して保存しても各段の定義に無いキーを保ち、issue は送った並びの行に付く", async () => {
  const name = { type: "text", key: "name", label: "名前" };
  const fields = fieldDefinitions.parse([
    { type: "group", key: "hero", label: "見出し", fields: [name] },
    { type: "repeat", key: "rows", label: "行", fields: [name] },
  ]);
  let sent: unknown;
  edit({
    "admin/kinds/get": () => ({ output: { ...kind, fields } }),
    "admin/fixedPages/get": () => ({
      output: {
        ...page,
        content: {
          legacy: null,
          hero: { name: "紹介", other: 1 },
          rows: [
            { name: "A", extra: "a" },
            { name: "B", extra: "b" },
            { name: "C", extra: "c" },
          ],
        },
      },
    }),
    "admin/fixedPages/update": (input) => {
      sent = input;
      return {
        error: "INVALID_CONTENT",
        data: {
          issues: [
            { path: ["rows", 0, "name"], code: "too_big", message: "English" },
            { path: ["hero"], code: "custom", message: "English" },
            { path: ["rows"], code: "custom", message: "English" },
            { path: ["missing"], code: "invalid_format", message: "English" },
          ],
        },
      };
    },
  });
  await userEvent.click(
    await screen.findByRole("button", { name: "行 2 を上へ" }),
  );
  await waitFor(() => {
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "行 1 を下へ" }),
    );
  });
  await userEvent.click(screen.getByRole("button", { name: "行 2 を削除" }));
  await waitFor(() => {
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "行 2 を削除" }),
    );
  });
  await userEvent.click(screen.getByRole("button", { name: "行を追加" }));
  await userEvent.type(
    within(screen.getByRole("group", { name: "行 3" })).getByRole("textbox", {
      name: "名前",
    }),
    "D",
  );
  await save();
  const invalid = await screen.findByRole("textbox", {
    name: "名前",
    description: "長すぎます。",
  });
  expect(invalid).toBe(screen.getByDisplayValue("B"));
  expect(sent).toEqual({
    id: page.id,
    slug: "about",
    title: "紹介",
    content: {
      legacy: null,
      hero: { name: "紹介", other: 1 },
      rows: [
        { name: "B", extra: "b" },
        { name: "C", extra: "c" },
        { name: "D" },
      ],
    },
  });
  expect(
    within(screen.getByRole("group", { name: "見出し" })).getByText(
      "値を確認してください。",
    ),
  ).toBeDefined();
  expect(
    within(screen.getByRole("group", { name: "行" })).getByText(
      "値を確認してください。",
    ),
  ).toBeDefined();
  expect(await screen.findByText(/種類の定義が変わった可能性/v)).toBeDefined();
  expect(await screen.findByText(/missing.*形式/v)).toBeDefined();
  await userEvent.click(screen.getByRole("button", { name: "行 1 を下へ" }));
  expect(
    within(screen.getByRole("group", { name: "行 2" })).getByRole("textbox", {
      description: "長すぎます。",
    }),
  ).toBe(invalid);
  await userEvent.type(invalid, "2");
  expect(screen.queryByText("長すぎます。")).toBeNull();
});

test("更新時の NOT_FOUND は、Toast でなく画面に残る知らせで伝える", async () => {
  edit({ "admin/fixedPages/update": () => ({ error: "NOT_FOUND" }) });
  await save();

  expect(
    await screen.findByText("この固定ページはもうありません。"),
  ).toBeDefined();
  expect(screen.queryByRole("region", { name: /通知/v })).toBeNull();
});

test("保存の失敗を Toast で知らせ、送り直して成功したら失敗の知らせが消える", async () => {
  let failed = false;
  edit({
    "admin/fixedPages/update": () => {
      if (failed) return { output: page };

      failed = true;

      return { error: "INTERNAL_SERVER_ERROR", defined: false };
    },
  });
  await save();
  const toast = await within(
    await screen.findByRole("region", { name: /通知/v }),
  ).findByRole("alert");

  expect(toast.textContent).toBe(
    "固定ページを保存できませんでした。もう一度試してください。",
  );
  expect(screen.getAllByRole("alert")).toEqual([toast]);
  await save("bottom");
  await screen.findByText("固定ページを更新しました。");
  await waitFor(() => {
    expect(toast.isConnected).toBe(false);
  });
});

test("slug の重複は入力欄で知らせ、変更すると消す", async () => {
  edit({ "admin/fixedPages/update": () => ({ error: "SLUG_TAKEN" }) });
  await save();
  const input = await screen.findByRole("textbox", {
    name: "slug",
    description: /この slug は、ほかの固定ページが使っています。/v,
  });
  await waitFor(() => {
    expect(document.activeElement).toBe(input);
  });
  await userEvent.type(input, "-2");
  expect(
    screen.queryByText("この slug は、ほかの固定ページが使っています。"),
  ).toBeNull();
});

test("slug は blur、空のタイトルは送信時に知らせ、種類が消えた場合は作成時に知らせる", async () => {
  const { calls } = renderApp({
    path: "/fixed-pages/new?kind=profile",
    routes: {
      ...routes,
      "admin/fixedPages/create": () => ({ error: "UNKNOWN_KIND" }),
    },
  });
  const slug = await screen.findByRole("textbox", { name: "slug" });
  await userEvent.type(slug, "A");
  await userEvent.tab();
  expect(
    await screen.findByText("slug の文字と長さを確認してください。"),
  ).toBeDefined();
  await userEvent.clear(slug);
  await userEvent.type(slug, "about");
  await save();
  expect(
    await screen.findByText(
      "タイトルは1〜200文字で、改行を使わずに入力してください。",
    ),
  ).toBeDefined();
  expect(calls).not.toContain("admin/fixedPages/create");
  await userEvent.type(
    screen.getByRole("textbox", { name: "タイトル" }),
    "紹介",
  );
  await save();
  expect(await screen.findByText("この種類はもうありません。")).toBeDefined();
});

test("値を変えたまま一覧へ移ろうとすると確かめ、編集を続けると値を残し、破棄すると移る", async () => {
  const { history } = edit({});
  const title = await screen.findByRole("textbox", { name: "タイトル" });

  await userEvent.type(title, "の続き");
  await userEvent.click(screen.getByRole("link", { name: "固定ページの一覧" }));
  const dialog = await screen.findByRole("dialog", {
    name: "保存していない変更があります",
  });
  await userEvent.click(
    within(dialog).getByRole("button", { name: "編集を続ける" }),
  );
  await waitFor(() => {
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  expect(history.location.pathname).toBe("/fixed-pages/" + page.id);
  expect(
    screen.getByRole<HTMLInputElement>("textbox", { name: "タイトル" }).value,
  ).toBe("紹介の続き");

  await userEvent.click(screen.getByRole("link", { name: "固定ページの一覧" }));
  await userEvent.click(
    within(
      await screen.findByRole("dialog", {
        name: "保存していない変更があります",
      }),
    ).getByRole("button", { name: "変更を破棄" }),
  );
  await waitFor(() => {
    expect(history.location.pathname).toBe("/fixed-pages");
  });
});

test("値を変えていないときと、変えた値を保存した後は、確かめずに移る", async () => {
  const { history } = edit({
    "admin/fixedPages/update": (input) => ({ output: { ...page, ...input } }),
  });
  const title = await screen.findByRole("textbox", { name: "タイトル" });

  await userEvent.type(title, "X");
  await userEvent.clear(title);
  await userEvent.type(title, "紹介");
  history.push("/");
  await screen.findByRole("heading", { name: "ホーム" });
  history.push("/fixed-pages/" + page.id);

  await userEvent.type(
    await screen.findByRole("textbox", { name: "タイトル" }),
    "の続き",
  );
  await save();
  await screen.findByText("固定ページを更新しました。");
  history.push("/");

  expect(await screen.findByRole("heading", { name: "ホーム" })).toBeDefined();
  expect(screen.queryByRole("dialog")).toBeNull();
});

test("保存の応答を待つ間に元のタイトルに戻しても、離れる前に確かめる", async () => {
  const pending = Promise.withResolvers<undefined>();
  const { history } = edit({
    "admin/fixedPages/update": async (input) => {
      await pending.promise;
      return { output: { ...page, ...input } };
    },
  });
  const title = await screen.findByRole("textbox", { name: "タイトル" });
  await userEvent.type(title, "X");
  await save();
  await screen.findAllByRole("progressbar");
  await userEvent.type(title, "{End}{Backspace}");
  expect(screen.getByDisplayValue(page.title)).toBe(title);

  history.push("/");
  const dialog = await screen.findByRole("dialog", {
    name: "保存していない変更があります",
  });
  await userEvent.click(
    within(dialog).getByRole("button", { name: "編集を続ける" }),
  );
  pending.resolve(undefined);
  await screen.findByText("固定ページを更新しました。");
  expect(screen.getByDisplayValue(page.title)).toBe(title);
});
