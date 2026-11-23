import { act, cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, setSystemTime, test } from "bun:test";

import { kindDefinition } from "@analemma/contract";

import {
  FIXED_PAGE_KINDS_KEY,
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

const setup = () => {
  const server = createFixedPageRoutes({ kinds: [kind], pages: [page] });
  const app = renderApp({ path: "/fixed-pages", routes: server.routes });

  return { ...app, server };
};

const updatedKind = {
  ...kind,
  ...kindDefinition.parse({
    ...kind,
    fields: [{ key: "lead", type: "text", label: "リード文" }],
  }),
};

const listRow = () => screen.findByRole("row", { name: page.title });

const openPicker = async () => {
  const [create] = screen.getAllByRole("button", { name: "新しい固定ページ" });

  if (create === undefined) throw new Error("作成するボタンがありません");

  await userEvent.click(create);

  return screen.findByRole("button", { name: kind.label });
};

const edit = async () => {
  await userEvent.click(screen.getByRole("button", { name: "「紹介」を編集" }));
  await screen.findByRole("textbox", { name: "タイトル" });
};

const backToList = async () => {
  await userEvent.click(screen.getByRole("link", { name: "固定ページの一覧" }));
  await listRow();
};

test("種類の一覧は15分以内なら取り直さず、期限後は元の選択肢を出してから新しいラベルを反映する", async () => {
  const { calls, server } = setup();
  await listRow();
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
  expect(
    await screen.findByRole("button", { name: "プロフィール" }),
  ).toBeDefined();
});

test("固定ページ内では一度開いた種類の定義だけを使い回し、ほかのタブを開くと種類の一覧と定義を捨てる", async () => {
  const { calls, queryClient } = setup();
  await listRow();
  await edit();
  await backToList();
  const choice = await openPicker();
  await userEvent.click(choice);
  await screen.findByRole("textbox", { name: "タイトル" });
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

test("期限後の種類の更新が失敗しても成功しても、編集しているフォームと入力を保つ", async () => {
  const { queryClient, server } = setup();
  await listRow();
  await edit();
  await backToList();

  const key = kindQueryKey(kind.name);
  queryClient.setQueryDefaults(key, { retry: false });
  const held = Promise.withResolvers<FakeReply<"admin/kinds/get">>();
  server.replyNext("admin/kinds/get", () => held.promise);
  setSystemTime(Date.now() + 16 * 60_000);
  await edit();

  const title = screen.getByRole<HTMLInputElement>("textbox", {
    name: "タイトル",
  });

  await userEvent.type(title, "の下書き");

  held.resolve({ error: "INTERNAL_SERVER_ERROR", defined: false });
  await waitFor(() => {
    expect(queryClient.getQueryState(key)?.status).toBe("error");
  });
  expect(screen.getByRole("textbox", { name: "タイトル" }) === title).toBe(
    true,
  );

  expect(title.value).toBe("紹介の下書き");

  server.replyNext("admin/kinds/get", () => ({
    output: { ...updatedKind, label: "プロフィール" },
  }));
  await act(async () => {
    await queryClient.refetchQueries({ queryKey: key });
  });
  await screen.findByText("種類:プロフィール");
  await screen.findByText(/入力を手元に控えて/v);
  expect(screen.queryByRole("textbox", { name: "リード文" })).toBeNull();
  expect(screen.getByRole("textbox", { name: "タイトル" }) === title).toBe(
    true,
  );
  expect(title.value).toBe("紹介の下書き");
});

test("期限後に必須項目が増えたとき、未編集の作成フォームに新しい項目を入力して保存できる", async () => {
  const server = createFixedPageRoutes({ kinds: [updatedKind] });
  server.replyNext("admin/kinds/get", () => ({ output: kind }));
  renderApp({ path: "/fixed-pages/new", routes: server.routes });

  await userEvent.click(
    await screen.findByRole("button", { name: kind.label }),
  );
  await screen.findByRole("textbox", { name: "タイトル" });
  await userEvent.click(screen.getByRole("link", { name: "固定ページの一覧" }));
  await screen.findByRole("heading", { name: "固定ページ" });

  const held = Promise.withResolvers<FakeReply<"admin/kinds/get">>();
  server.replyNext("admin/kinds/get", () => held.promise);
  setSystemTime(Date.now() + 16 * 60_000);
  await userEvent.click(await openPicker());
  await screen.findByRole("textbox", { name: "タイトル" });
  expect(screen.queryByRole("textbox", { name: "リード文" })).toBeNull();

  held.resolve({ output: updatedKind });

  const lead = await screen.findByRole<HTMLInputElement>("textbox", {
    name: "リード文",
  });

  await userEvent.type(lead, "更新後の項目");
  await userEvent.type(screen.getByRole("textbox", { name: "slug" }), "intro");
  await userEvent.type(
    screen.getByRole("textbox", { name: "タイトル" }),
    "はじめに",
  );
  const [save] = screen.getAllByRole("button", { name: "保存" });

  if (save === undefined) throw new Error("保存のボタンがありません");

  await userEvent.click(save);
  await screen.findByText("固定ページを作成しました。");
  expect(server.pages()[0]?.content).toEqual({ lead: "更新後の項目" });
});

test("見つからなかった種類を選び直すと、15分以内でも定義を取り直す", async () => {
  const { server, calls } = setup();
  await listRow();
  server.replyNext("admin/kinds/get", () => ({ error: "NOT_FOUND" }));
  await userEvent.click(await openPicker());
  await screen.findByText("この種類はもうありません。");
  await userEvent.click(screen.getByRole("button", { name: "種類を選び直す" }));
  await userEvent.click(
    await screen.findByRole("button", { name: kind.label }),
  );
  await screen.findByRole("textbox", { name: "タイトル" });
  expect(calls.filter((path) => path === "admin/kinds/get")).toHaveLength(2);
});
