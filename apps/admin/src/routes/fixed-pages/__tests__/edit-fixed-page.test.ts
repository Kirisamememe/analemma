import { cleanup, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import type { FakeReply } from "@/testing/create-fake-api";
import { kind, page } from "@/testing/fixed-page-samples";
import { renderApp } from "@/testing/render-app";

afterEach(cleanup);

test("固定ページと種類の定義を読み終えるまで、種類の名前を出さずに読み込み中のままにする", async () => {
  const pageReply = Promise.withResolvers<FakeReply<"admin/fixedPages/get">>();
  const kindReply = Promise.withResolvers<FakeReply<"admin/kinds/get">>();

  const { calls } = renderApp({
    path: "/fixed-pages/" + page.id,
    routes: {
      "admin/session/get": () => ({
        output: { expiresAt: "2026-11-23T00:00:00.000Z" },
      }),
      "admin/fixedPages/get": () => pageReply.promise,
      "admin/kinds/get": () => kindReply.promise,
    },
  });

  const loading = await screen.findByRole("status");

  await waitFor(() => {
    expect(calls).toContain("admin/fixedPages/get");
  });
  expect(calls).not.toContain("admin/kinds/get");
  pageReply.resolve({ output: page });

  await waitFor(() => {
    expect(calls).toContain("admin/kinds/get");
  });
  expect(screen.getByRole("status")).toBe(loading); // 種類を読む間も、同じ読み込み中の欄を出し続ける
  expect(screen.queryByText(`種類:${page.kind}`)).toBeNull();

  kindReply.resolve({ output: { ...kind, label: "紹介のページ" } });

  expect(await screen.findByText("種類:紹介のページ")).toBeDefined();
  expect(screen.queryByRole("status")).toBeNull();
});
