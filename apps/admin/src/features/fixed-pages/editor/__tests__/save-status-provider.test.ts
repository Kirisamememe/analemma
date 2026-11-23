import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "bun:test";

import type { FakeRoutes } from "@/testing/create-fake-api";
import { kind, page } from "@/testing/fixed-page-samples";
import { renderApp } from "@/testing/render-app";

afterEach(cleanup);

const edit = (update: NonNullable<FakeRoutes["admin/fixedPages/update"]>) =>
  renderApp({
    path: "/fixed-pages/" + page.id,
    routes: {
      "admin/session/get": () => ({ output: { expiresAt: page.createdAt } }),
      "admin/kinds/get": () => ({ output: kind }),
      "admin/kinds/list": () => ({ output: { kinds: [kind] } }),
      "admin/fixedPages/get": () => ({ output: page }),
      "admin/fixedPages/update": update,
    },
  });

test("編集を送ったら背景の操作を止め、成功の表示に切り替わった後に閉じて編集を続けられる", async () => {
  const pending = Promise.withResolvers<undefined>();

  const { calls } = edit(async (input) => {
    await pending.promise;
    return { output: { ...page, ...input } };
  });

  const title = await screen.findByRole<HTMLInputElement>("textbox", {
    name: "タイトル",
  });

  await userEvent.type(title, "X{Enter}");

  const saving = await screen.findByRole("dialog", {
    name: "固定ページを保存しています",
  });

  await userEvent.keyboard("追記");
  expect(title.value).toBe(page.title + "X");
  await userEvent.keyboard("{Escape}");
  await userEvent.click(document.body);
  expect(saving.isConnected).toBe(true);
  expect(within(saving).queryByRole("button")).toBeNull();
  expect(
    calls.filter((path) => path === "admin/fixedPages/update"),
  ).toHaveLength(1);

  pending.resolve(undefined);

  const saved = await screen.findByRole("dialog", {
    name: "固定ページを更新しました。",
  });

  expect(saved).toBe(saving);
  expect(screen.queryByRole("alert")).toBeNull();
  await userEvent.click(within(saved).getByRole("button", { name: "閉じる" }));
  await userEvent.type(title, "Y");
  expect(title.value).toBe(page.title + "XY");
});

test("セッション切れで保存できず編集を続けたら、残った入力を選択して使える", async () => {
  edit(() => ({ error: "UNAUTHORIZED" }));

  const title = await screen.findByRole<HTMLInputElement>("textbox", {
    name: "タイトル",
  });

  await userEvent.type(title, "の下書き{Enter}");
  await userEvent.click(
    await screen.findByRole("button", { name: "編集を続ける" }),
  );
  expect(screen.queryByRole("dialog")).toBeNull();
  await userEvent.type(title, "を保持");
  expect(title.value).toBe("紹介の下書きを保持");
});

test("保存中に履歴で種類を選ぶ画面に移ったら、前の応答が届いても次の種類を選べる", async () => {
  const pending = Promise.withResolvers<undefined>();

  const { history } = edit(async () => {
    await pending.promise;
    return { output: page };
  });

  const [save] = await screen.findAllByRole("button", { name: "保存" });

  if (!save) throw new Error("保存ボタンがありません");

  await userEvent.click(save);
  await screen.findByRole("dialog", { name: "固定ページを保存しています" });
  history.push("/fixed-pages/new");
  const choice = await screen.findByRole("button", { name: kind.label });
  pending.resolve(undefined);
  await userEvent.click(choice);
  expect(await screen.findByRole("textbox", { name: "slug" })).toBeDefined();
  expect(screen.queryByRole("dialog")).toBeNull();
});
