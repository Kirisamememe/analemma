import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "bun:test";

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
  expect(await screen.findByText("読み込んでいます")).toBeDefined();
  pending.resolve(undefined);
  expect(
    await screen.findByRole("heading", { name: "選べる種類がありません" }),
  ).toBeDefined();
  expect(
    screen.getByRole("heading", { name: "固定ページの種類を追加するには" }),
  ).toBeDefined();
  await userEvent.click(screen.getByText("定義の書き方とコマンド例"));
  expect(
    screen.getByText("analemma push-kinds ./src/lib/kinds.ts"),
  ).toBeDefined();
});
