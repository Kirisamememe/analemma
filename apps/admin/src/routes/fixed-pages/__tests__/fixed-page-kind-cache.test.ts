import { act, cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, setSystemTime, test } from "bun:test";

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

const listRow = () => screen.findByRole("row", { name: page.title });

const openPicker = async () => {
  await userEvent.click(
    screen.getByRole("button", { name: "新しい固定ページ" }),
  );

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

test("種類の一覧は15分以内なら取り直さず、期限後は元の選択肢を出してから新しい種類名を反映する", async () => {
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
    output: { ...kind, label: "プロフィール" },
  }));
  await act(async () => {
    await queryClient.refetchQueries({ queryKey: key });
  });
  await screen.findByText("種類:プロフィール");
  expect(screen.getByRole("textbox", { name: "タイトル" }) === title).toBe(
    true,
  );
  expect(title.value).toBe("紹介の下書き");
});
