import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { ImageDetail } from "@/features/images/detail/image-detail";
import { createTestApp } from "@/testing/create-test-app";
import {
  createImageRoutes,
  type FakeImageSeed,
} from "@/testing/fake-routes/create-image-routes";
import { withAppProviders } from "@/testing/hook-wrappers";
import { samplePhoto } from "@/testing/sample-photos";

afterEach(cleanup);

const open = async (seed: FakeImageSeed) => {
  const server = createImageRoutes([seed]);
  const [image] = server.images();
  const app = createTestApp({ path: "/", routes: server.routes });

  if (image === undefined) throw new Error("画像がありません");

  await app.router.load();
  render(
    <ImageDetail
      back={null}
      image={image}
      next={undefined}
      onMove={() => undefined}
      previous={undefined}
    />,
    { wrapper: withAppProviders(app) },
  );
};

describe("ImageDetail", () => {
  test("タイトル・公開状態・説明・alt・撮影の情報を、情報の欄に出す", async () => {
    await open({
      title: "夕暮れの稜線",
      description: "峠から見た。",
      alt: "山並み",
      camera: "FUJIFILM X-T5",
      iso: 200,
      deliveryImages: samplePhoto("dusk-ridge"),
    });

    const panel = await screen.findByRole("complementary");

    expect(
      within(panel).getByRole("heading", { level: 1, name: "夕暮れの稜線" }),
    ).toBeDefined();
    expect(within(panel).getByText("公開中")).toBeDefined();
    expect(within(panel).getByText("峠から見た。")).toBeDefined();
    expect(within(panel).getByText("山並み")).toBeDefined();
    expect(within(panel).getByText("FUJIFILM X-T5")).toBeDefined();
    expect(within(panel).queryByText("レンズ")).toBeNull();
    expect(screen.getByRole("img", { name: "山並み" })).toBeDefined();
  });

  test("タイトル・説明・alt・撮影の情報が無ければ、無いことが分かるように出す", async () => {
    await open({ published: false });

    const panel = await screen.findByRole("complementary");

    expect(
      within(panel).getByRole("heading", { level: 1, name: "無題の画像" }),
    ).toBeDefined();
    expect(within(panel).getByText("非公開")).toBeDefined();
    expect(within(panel).queryByText("説明")).toBeNull();
    expect(within(panel).getByText("撮影の情報はありません。")).toBeDefined();
    expect(screen.getByText("表示用の画像がまだありません")).toBeDefined();
  });
});
