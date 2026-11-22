import { cleanup, screen } from "@testing-library/react";
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
  expect(await screen.findByText("読み込んでいます。")).toBeDefined();
  pending.resolve(undefined);
  expect(await screen.findByText("選べる種類がありません。")).toBeDefined();
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
