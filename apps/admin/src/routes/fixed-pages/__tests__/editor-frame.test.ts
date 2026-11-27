import { act, cleanup, screen } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import { kind, page } from "@/testing/fixed-page-samples";
import { renderApp } from "@/testing/render-app";

afterEach(cleanup);

const session = {
  "admin/session/get": () => ({
    output: { expiresAt: "2026-11-23T00:00:00.000Z" },
  }),
};

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
