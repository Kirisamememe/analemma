import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, mock, test } from "bun:test";

import { ImagesSection } from "@/features/images/list/images-section";
import type { FakeRoutes } from "@/testing/create-fake-api";
import { createTestApp } from "@/testing/create-test-app";
import {
  createImageRoutes,
  type FakeImageSeed,
} from "@/testing/fake-routes/create-image-routes";
import { withAppProviders } from "@/testing/hook-wrappers";
import { samplePhoto } from "@/testing/sample-photos";

afterEach(cleanup);

const deliveryImages = samplePhoto("dusk-ridge");

const IMAGES: readonly FakeImageSeed[] = [
  { title: "夕暮れの稜線", takenAt: "2025-05-01T18:42:07", deliveryImages },
  { title: "港の灯り", published: false, deliveryImages },
  { alt: "霧に包まれた湖", deliveryImages },
  { title: "変換を待つ写真" },
];

const many = (count: number): FakeImageSeed[] =>
  Array.from({ length: count }, (_, index) => ({
    title: `写真 ${String(index + 1)}`,
    deliveryImages,
  }));

const linkNames = async (): Promise<string[]> =>
  within(await screen.findByRole("list", { name: "画像" }))
    .getAllByRole("link")
    .map((link) => link.textContent);

const renderSection = async (
  routes: FakeRoutes,
  imageHref = (_id: string): "/fixed-pages" => "/fixed-pages",
) => {
  const app = createTestApp({ path: "/", routes });

  await app.router.load();
  render(<ImagesSection imageHref={imageHref} />, {
    wrapper: withAppProviders(app),
  });
};

describe("ImagesSection", () => {
  test("新しく足した順に並べ、非公開・タイトルの無い画像・配信用の画像の無い画像を見分けて出す", async () => {
    await renderSection(createImageRoutes(IMAGES).routes);

    expect(await linkNames()).toEqual([
      "夕暮れの稜線2025/05/01",
      "港の灯り非公開",
      "無題",
      "表示用の画像がまだありません変換を待つ写真",
    ]);
    expect(
      screen.getByRole("link", { name: "霧に包まれた湖 無題" }),
    ).toBeDefined();
  });

  test("画像が無ければ、中身の無い欄を出す", async () => {
    await renderSection(createImageRoutes([]).routes);

    expect(
      await screen.findByRole("heading", { name: "画像はまだありません" }),
    ).toBeDefined();
  });

  test("一覧を読めなければ読めなかった欄を出し、もう一度試すと取り直す", async () => {
    const server = createImageRoutes(IMAGES);
    let broken = true;

    await renderSection({
      ...server.routes,
      "admin/images/list": (input) =>
        broken
          ? { error: "INTERNAL_SERVER_ERROR", defined: false }
          : server.routes["admin/images/list"](input),
    });

    const alert = await screen.findByRole("alert", {}, { timeout: 8000 });

    expect(
      within(alert).getByRole("heading", {
        name: "画像を読み込めませんでした",
      }),
    ).toBeDefined();
    broken = false;
    await userEvent.click(screen.getByRole("button", { name: "もう一度試す" }));
    expect(await linkNames()).toHaveLength(4);
  }, 15_000);

  test("続きを読むと下に足して、足した最初の画像に focus を移し、最後まで読むと操作を消す", async () => {
    const imageHref = mock((_id: string): "/fixed-pages" => "/fixed-pages");

    await renderSection(createImageRoutes(many(55)).routes, imageHref);

    expect(await linkNames()).toHaveLength(50);
    await userEvent.click(
      screen.getByRole("button", { name: "さらに読み込む" }),
    );
    await waitFor(async () => {
      expect(await linkNames()).toHaveLength(55);
    });
    await waitFor(() => {
      expect(document.activeElement?.textContent).toBe("写真 51");
    });
    expect(screen.queryByRole("button", { name: "さらに読み込む" })).toBeNull();
    expect(imageHref).toHaveBeenCalledTimes(55);
  });

  test("続きを読めなければ50枚を残し、通信が戻れば残りを読んで最初の新しい写真に focus を移す", async () => {
    const { routes } = createImageRoutes(many(55));
    let broken = true;
    await renderSection({
      ...routes,
      "admin/images/list": (input) =>
        broken && input.cursor !== undefined
          ? { error: "INTERNAL_SERVER_ERROR", defined: false }
          : routes["admin/images/list"](input),
    });

    expect(await linkNames()).toHaveLength(50);
    await userEvent.click(
      screen.getByRole("button", { name: "さらに読み込む" }),
    );

    const alert = await screen.findByRole("alert", {}, { timeout: 8000 });

    expect(
      within(alert).getByRole("heading", {
        name: "続きの画像を読み込めませんでした",
      }),
    ).toBeDefined();
    expect(await linkNames()).toHaveLength(50);
    broken = false;
    await userEvent.click(screen.getByRole("button", { name: "もう一度試す" }));
    await waitFor(async () => {
      expect(await linkNames()).toHaveLength(55);
    });
    expect(document.activeElement?.textContent).toBe("写真 51");
  }, 15_000);
});
