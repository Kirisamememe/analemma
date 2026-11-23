import { act, cleanup, screen, waitFor } from "@testing-library/react";
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

  test("キーボードで次の写真を開くと同じ方向に続けて進め、最後は前の写真に戻れる", async () => {
    setUp(0);
    const user = userEvent.setup();
    const next = await screen.findByRole("link", { name: "次の画像" });

    act(() => {
      next.focus();
    });
    await user.keyboard("{Enter}");
    await heading("港の灯り");
    await waitFor(() => {
      expect(
        document.activeElement ===
          screen.getByRole("link", { name: "次の画像" }),
      ).toBe(true);
    });
    await user.keyboard("{Enter}");
    await heading("雪の参道");
    await waitFor(() => {
      expect(
        document.activeElement ===
          screen.getByRole("link", { name: "前の画像" }),
      ).toBe(true);
    });
  });

  test("前後の取得に失敗しても写真を表示し、取り直した後は次の写真へ進める", async () => {
    const server = createImageRoutes(IMAGES);
    let offline = true;
    renderApp({
      path: `/images/${server.images()[0]?.id ?? ""}`,
      routes: {
        ...server.routes,
        "admin/images/neighbors": (input) =>
          offline
            ? { error: "INTERNAL_SERVER_ERROR", defined: false }
            : server.routes["admin/images/neighbors"](input),
      },
    });
    await heading("夕暮れの稜線");
    await screen.findByRole(
      "heading",
      { name: "前後の画像を読み込めませんでした" },
      { timeout: 8000 },
    );
    offline = false;
    await userEvent.click(screen.getByRole("button", { name: "もう一度試す" }));
    await userEvent.click(
      await screen.findByRole("link", { name: "次の画像" }),
    );
    await heading("港の灯り");
  }, 15_000);

  test("無い画像を開くと、もう無いことを知らせる", async () => {
    setUp(0, "/images/019b0000-0000-7000-8000-0000000000ff");

    expect(await screen.findByText("この画像はもうありません。")).toBeDefined();
    expect(screen.getByRole("link", { name: "画像の一覧" })).toBeDefined();
  });
});
