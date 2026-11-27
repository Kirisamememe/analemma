import { cleanup, screen, within } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import {
  createImageRoutes,
  type FakeImageSeed,
} from "@/testing/fake-routes/create-image-routes";
import { renderApp } from "@/testing/render-app";

afterEach(cleanup);

const open = async (seed: FakeImageSeed) => {
  const server = createImageRoutes([seed]);
  const id = server.images()[0]?.id ?? "";

  renderApp({ path: "/images/" + id, routes: server.routes });
  await screen.findByRole("heading", { name: seed.title ?? "無題" });
};

test("変換中の画像には、待っていることを伝え、公開と非公開の操作を出さない", async () => {
  await open({ title: "港", status: "processing" });

  expect(
    within(screen.getByRole("complementary")).getByText("変換中"),
  ).toBeDefined();
  expect(screen.getByText("表示用の画像を作っています")).toBeDefined();
  expect(screen.queryByRole("button", { name: "公開する" })).toBeNull();
  expect(screen.queryByRole("button", { name: "非公開にする" })).toBeNull();
  expect(screen.getByRole("button", { name: "画像を削除" })).toBeDefined();
});

test.each([
  ["unreadable", /写真を読み取れませんでした/v],
  ["interrupted", /サーバーの問題で変換できませんでした/v],
] as const)(
  "%s の画像には、変換できなかった理由を伝え、削除の操作を残す",
  async (status, reason) => {
    await open({ title: "港", status });

    expect(
      within(screen.getByRole("complementary")).getByText("変換失敗"),
    ).toBeDefined();
    expect(screen.getByText(reason)).toBeDefined();
    expect(screen.queryByRole("button", { name: "公開する" })).toBeNull();
    expect(screen.getByRole("button", { name: "画像を削除" })).toBeDefined();
  },
);

test("変換を終えた画像には、公開と非公開の操作を出す", async () => {
  await open({ title: "港" });

  expect(screen.getByRole("button", { name: "非公開にする" })).toBeDefined();
});
