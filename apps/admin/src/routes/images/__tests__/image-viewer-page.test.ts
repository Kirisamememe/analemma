import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "bun:test";

import type { FakeReply } from "@/testing/create-fake-api";
import {
  createImageRoutes,
  type FakeImageSeed,
} from "@/testing/fake-routes/create-image-routes";
import { renderApp } from "@/testing/render-app";

afterEach(cleanup);

const IMAGES: readonly FakeImageSeed[] = [
  { title: "夕暮れの稜線" },
  { title: "港の灯り", alt: "夜の港" },
  { title: "雪の参道" },
];

const setUp = (index: number, path?: string) => {
  const server = createImageRoutes(IMAGES);
  const ids = server.images().map(({ id }) => id);

  const app = renderApp({
    path: path ?? `/images/${ids[index] ?? ""}`,
    routes: server.routes,
  });

  return { server, ids, ...app };
};

const heading = async (name: string) =>
  screen.findByRole("heading", { level: 1, name });

describe("ImageViewerPage", () => {
  test("画像の URL を直接開くと、セッション確認の応答を待たずに写真を見る画面を描く", async () => {
    const server = createImageRoutes(IMAGES);
    const session = Promise.withResolvers<FakeReply<"admin/session/get">>();

    const { calls } = renderApp({
      path: `/images/${server.images()[0]?.id ?? ""}`,
      routes: { ...server.routes, "admin/session/get": () => session.promise },
    });

    await heading("夕暮れの稜線");
    expect(calls).toContain("admin/session/get");
    session.resolve({ output: { expiresAt: "2026-01-08T00:00:00.000Z" } });
  });

  test("一覧の画像を押すと、その画像を見る画面を開く", async () => {
    const { history, ids } = setUp(0, "/images");

    await userEvent.click(
      await screen.findByRole("link", { name: /港の灯り/v }),
    );
    await heading("港の灯り");
    expect(history.location.pathname).toBe(`/images/${ids[1] ?? ""}`);
  });

  test("一覧の並びで前と次の画像へのリンクを置き、押すとその画像に移る", async () => {
    const { history, ids } = setUp(1);

    await heading("港の灯り");
    await userEvent.click(
      await screen.findByRole("link", { name: "次の画像" }),
    );
    await heading("雪の参道");
    expect(history.location.pathname).toBe(`/images/${ids[2] ?? ""}`);
    expect(screen.queryByRole("link", { name: "次の画像" })).toBeNull();
    expect(screen.getByRole("link", { name: "前の画像" })).toBeDefined();
  });

  test("無い画像を開くと、もう無いことを知らせる", async () => {
    setUp(0, "/images/019b0000-0000-7000-8000-0000000000ff");

    expect(await screen.findByText("この画像はもうありません。")).toBeDefined();
    expect(screen.getByRole("link", { name: "画像の一覧" })).toBeDefined();
  });
});
