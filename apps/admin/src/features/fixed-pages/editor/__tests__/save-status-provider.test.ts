import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "bun:test";

import { kind, page } from "@/testing/fixed-page-samples";
import { renderApp } from "@/testing/render-app";

afterEach(cleanup);

test("編集を送ったら背景の操作を止め、成功の表示に切り替わった後に閉じて編集を続けられる", async () => {
  const pending = Promise.withResolvers<undefined>();

  const { calls } = renderApp({
    path: "/fixed-pages/" + page.id,
    routes: {
      "admin/session/get": () => ({ output: { expiresAt: page.createdAt } }),
      "admin/kinds/get": () => ({ output: kind }),
      "admin/fixedPages/get": () => ({ output: page }),
      "admin/fixedPages/update": async (input) => {
        await pending.promise;
        return { output: { ...page, ...input } };
      },
    },
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
