import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, setSystemTime, test } from "bun:test";

import { kindDefinition } from "@analemma/contract";

import {
  FIXED_PAGE_KINDS_KEY,
  KINDS_QUERY_KEY,
  kindQueryKey,
} from "@/features/fixed-pages/queries/fixed-pages-query";
import type { FakeReply } from "@/testing/create-fake-api";
import { createFixedPageRoutes } from "@/testing/fake-routes/create-fixed-page-routes";
import { kind, page } from "@/testing/fixed-page-samples";
import { renderApp } from "@/testing/render-app";

afterEach(() => {
  cleanup();
  setSystemTime();
});

const setup = async () => {
  const server = createFixedPageRoutes({ kinds: [kind], pages: [page] });
  const app = renderApp({ path: "/fixed-pages", routes: server.routes });
  await listRow();

  return { ...app, server };
};

const withFields = (fields: unknown[]) => ({
  ...kind,
  ...kindDefinition.parse({ ...kind, fields }),
});

const updatedKind = withFields([
  { key: "lead", type: "text", label: "リード文" },
]);

const titleField = () =>
  screen.getByRole<HTMLInputElement>("textbox", { name: "タイトル" });

const findTitle = () => screen.findByRole("textbox", { name: "タイトル" });
const findButton = (name: string) => screen.findByRole("button", { name });
const button = (name: string) => screen.getByRole("button", { name });

const holdDefinition = (server: ReturnType<typeof createFixedPageRoutes>) => {
  const held = Promise.withResolvers<FakeReply<"admin/kinds/get">>();
  server.replyNext("admin/kinds/get", () => held.promise);

  return held;
};

const listRow = () => screen.findByRole("row", { name: page.title });

const pressFirst = async (name: string | RegExp) => {
  const [button] = screen.getAllByRole("button", { name });

  if (button === undefined) throw new Error("ボタンがありません");

  await userEvent.click(button);
};

const openPicker = async () => {
  await pressFirst("新しい固定ページ");
  return findButton(kind.label);
};

const save = () => pressFirst(/保存/v);

const edit = async () => {
  await userEvent.click(button("「紹介」を編集"));
  await findTitle();
};

const backToList = async () => {
  await userEvent.click(screen.getByRole("link", { name: "固定ページの一覧" }));
  await listRow();
};

test("種類の一覧は15分以内なら取り直さず、期限後は元の選択肢を出してから新しいラベルを反映する", async () => {
  const { calls, server } = await setup();
  const now = Date.now();
  setSystemTime(now + 14 * 60_000);
  await openPicker();
  await backToList();
  expect(calls.filter((path) => path === "admin/kinds/list")).toHaveLength(1);

  const held = Promise.withResolvers<FakeReply<"admin/kinds/list">>();
  server.replyNext("admin/kinds/list", () => held.promise);
  setSystemTime(now + 16 * 60_000);
  await openPicker();
  await waitFor(() => {
    expect(calls.filter((path) => path === "admin/kinds/list")).toHaveLength(2);
  });

  held.resolve({ output: { kinds: [{ ...kind, label: "プロフィール" }] } });
  await findButton("プロフィール");
});

test("固定ページ内では一度開いた種類の定義だけを使い回し、ほかのタブを開くと種類の一覧と定義を捨てる", async () => {
  const { calls, queryClient } = await setup();
  await edit();
  await backToList();
  await userEvent.click(await openPicker());
  await findTitle();
  expect(calls.filter((path) => path === "admin/kinds/get")).toHaveLength(1);

  const nav = within(screen.getByRole("navigation"));
  await userEvent.click(nav.getByRole("link", { name: "ホーム" }));
  await screen.findByRole("heading", { name: "ホーム" });
  expect(
    queryClient.getQueriesData({ queryKey: FIXED_PAGE_KINDS_KEY }),
  ).toEqual([]);

  await userEvent.click(nav.getByRole("link", { name: "固定ページ" }));
  await listRow();
  await edit();
  expect(calls.filter((path) => path === "admin/kinds/list")).toHaveLength(2);
  expect(calls.filter((path) => path === "admin/kinds/get")).toHaveLength(2);
});

const reopenWithPendingDefinition = async () => {
  const app = await setup();
  await edit();
  await backToList();
  app.queryClient.setQueryDefaults(kindQueryKey(kind.name), { retry: false });
  const pending = holdDefinition(app.server);
  setSystemTime(Date.now() + 16 * 60_000);
  await edit();

  return { ...app, pending };
};

test("期限後の種類の更新が失敗しても成功しても、編集しているフォームと入力を保つ", async () => {
  const { server, pending } = await reopenWithPendingDefinition();
  const title = titleField();

  await userEvent.type(title, "の下書き");

  pending.resolve({ error: "INTERNAL_SERVER_ERROR", defined: false });
  const retry = await findButton("再読み込み");
  expect(titleField() === title).toBe(true);
  expect(title.value).toBe("紹介の下書き");

  server.replyNext("admin/kinds/get", () => ({
    output: { ...updatedKind, label: "プロフィール" },
  }));
  await userEvent.click(retry);
  await screen.findByText("種類:プロフィール");
  await screen.findByText(/入力を手元に控えて/v);
  expect(screen.queryByRole("textbox", { name: "リード文" })).toBeNull();
  expect(titleField() === title).toBe(true);
  expect(title.value).toBe("紹介の下書き");
});

test("期限後に必須項目が増えたとき、未編集の作成フォームに新しい項目を入力して保存できる", async () => {
  const server = createFixedPageRoutes({ kinds: [updatedKind] });
  server.replyNext("admin/kinds/get", () => ({ output: kind }));
  renderApp({ path: "/fixed-pages/new", routes: server.routes });

  await userEvent.click(await findButton(kind.label));
  await findTitle();
  await userEvent.click(screen.getByRole("link", { name: "固定ページの一覧" }));
  await screen.findByRole("heading", { name: "固定ページ" });

  const held = holdDefinition(server);
  setSystemTime(Date.now() + 16 * 60_000);
  await userEvent.click(await openPicker());
  await findTitle();
  expect(screen.queryByRole("textbox", { name: "リード文" })).toBeNull();
  titleField().focus();

  held.resolve({ output: updatedKind });

  const lead = await screen.findByRole("textbox", { name: "リード文" });

  expect(document.activeElement === titleField()).toBe(true);
  await userEvent.type(lead, "更新後の項目");
  await userEvent.type(screen.getByRole("textbox", { name: "slug" }), "intro");
  await userEvent.type(titleField(), "はじめに");
  await save();
  await screen.findByText("固定ページを作成しました。");
  expect(server.pages()[0]?.content).toEqual({ lead: "更新後の項目" });
});

test("見つからなかった種類を選び直すと、15分以内でも定義を取り直す", async () => {
  const { server, calls } = await setup();
  server.replyNext("admin/kinds/get", () => ({ error: "NOT_FOUND" }));
  await userEvent.click(await openPicker());
  await screen.findByText("この種類はもうありません。");
  await userEvent.click(button("種類を選び直す"));
  await userEvent.click(await findButton(kind.label));
  await findTitle();
  expect(calls.filter((path) => path === "admin/kinds/get")).toHaveLength(2);
});

test("削除を送っている間に新しい項目が届いても確認を保ち、削除できたら一覧へ戻る", async () => {
  const { server, pending } = await reopenWithPendingDefinition();

  const deletion =
    Promise.withResolvers<FakeReply<"admin/fixedPages/delete">>();

  server.replyNext("admin/fixedPages/delete", () => deletion.promise);
  await userEvent.click(button("固定ページを削除"));
  const dialog = await screen.findByRole("dialog");
  await userEvent.click(within(dialog).getByRole("button", { name: "削除" }));
  pending.resolve({ output: { ...updatedKind, label: "更新後の種類" } });
  await screen.findByText("種類:更新後の種類");
  expect(screen.getByRole("dialog") === dialog).toBe(true);

  deletion.resolve({ output: undefined });
  await screen.findByRole("heading", { name: "固定ページ" });
});

test("種類の一覧を更新できなかったときだけ、前の種類を選べるまま再読み込みできる", async () => {
  const { queryClient, server } = await setup();
  expect(screen.queryByRole("button", { name: "再読み込み" })).toBeNull();
  queryClient.setQueryDefaults(KINDS_QUERY_KEY, { retry: false });
  server.replyNext("admin/kinds/list", () => ({
    error: "INTERNAL_SERVER_ERROR",
    defined: false,
  }));
  setSystemTime(Date.now() + 16 * 60_000);
  const choice = await openPicker();
  const retry = await findButton("再読み込み");
  expect(choice.hasAttribute("disabled")).toBe(false);
  server.replyNext("admin/kinds/list", () => ({
    output: { kinds: [{ ...kind, label: "更新後の種類" }] },
  }));
  await userEvent.click(retry);
  const updated = await findButton("更新後の種類");
  await waitFor(() => {
    expect(document.activeElement === updated).toBe(true);
  });
  expect(screen.queryByRole("button", { name: "再読み込み" })).toBeNull();
});

test("保存後に新しい項目へ切り替わっても、直前に保存したタイトルと入力した項目を続けて保存できる", async () => {
  const { server, pending } = await reopenWithPendingDefinition();
  await userEvent.type(titleField(), "の下書き");
  pending.resolve({ output: updatedKind });
  await screen.findByText(/入力を手元に控えて/v);
  await save();
  const lead = await screen.findByRole("textbox", { name: "リード文" });
  expect(titleField().value).toBe("紹介の下書き");
  await userEvent.type(lead, "続けて入力");
  await save();
  await waitFor(() => {
    expect(server.pages()[0]).toMatchObject({
      title: "紹介の下書き",
      content: { lead: "続けて入力" },
    });
  });
});

test("未編集のまま保存を送った後に新しい定義が届いても、保存中は重ねて送れない", async () => {
  const { server, calls, pending } = await reopenWithPendingDefinition();
  const sending = Promise.withResolvers<FakeReply<"admin/fixedPages/update">>();
  server.replyNext("admin/fixedPages/update", () => sending.promise);
  await save();
  await screen.findAllByRole("progressbar");
  pending.resolve({ output: updatedKind });
  await save();
  expect(
    calls.filter((path) => path === "admin/fixedPages/update"),
  ).toHaveLength(1);
  expect(screen.queryByRole("textbox", { name: "リード文" })).toBeNull();
  sending.resolve({ output: page });
  await screen.findByRole("textbox", { name: "リード文" });
});

const makeKind = (...values: string[]) =>
  withFields([
    {
      type: "select",
      key: "style",
      label: "表示",
      optional: true,
      options: values.map((value) => ({ value, label: value })),
    },
  ]);

test("別のタブで保存した選択値を古い定義で表示できないときだけ15分以内でも定義を読み直し、タイトルを保存しても選択値が残る", async () => {
  const server = createFixedPageRoutes({
    kinds: [makeKind("old", "new")],
    pages: [{ ...page, content: { style: "new" } }],
  });

  server.replyNext("admin/kinds/get", () => ({ output: makeKind("old") }));

  const { calls } = renderApp({
    path: "/fixed-pages/new?kind=profile",
    routes: server.routes,
  });

  await findTitle();
  await backToList();
  const held = holdDefinition(server);
  await userEvent.click(button("「紹介」を編集"));
  await waitFor(() => {
    expect(calls.filter((path) => path === "admin/kinds/get")).toHaveLength(2);
  });
  expect(screen.queryByRole("button", { name: "保存" })).toBeNull();
  held.resolve({ output: makeKind("old", "new") });
  await userEvent.type(await findTitle(), "の下書き");
  await save();
  await waitFor(() => {
    expect(server.pages()[0]).toMatchObject({
      title: "紹介の下書き",
      content: { style: "new" },
    });
  });
});
