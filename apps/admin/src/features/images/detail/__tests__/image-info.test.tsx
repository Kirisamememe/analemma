import { cleanup, screen } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import { ImageInfo } from "../image-info";

import {
  createImageRoutes,
  type FakeImageSeed,
} from "@/testing/fake-routes/create-image-routes";
import { renderWithI18n } from "@/testing/render-with-i18n";

afterEach(cleanup);

const show = (seed: FakeImageSeed) => {
  const [image] = createImageRoutes([seed]).images();

  if (image === undefined) throw new Error("画像がありません");

  renderWithI18n(<ImageInfo image={image} />, "ja");
};

test("説明と alt は、あるものだけを情報の欄に出す", () => {
  show({ title: "夕暮れの稜線", description: "稜線の夕暮れ。" });

  expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
    "夕暮れの稜線",
  );
  expect(screen.getByText("稜線の夕暮れ。")).toBeDefined();
  expect(screen.queryByText("alt")).toBeNull();
});

test("タイトルと撮影の情報が無ければ、無いことが分かるように出す", () => {
  show({});

  expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
    "無題の画像",
  );
  expect(screen.queryByText("説明")).toBeNull();
  expect(screen.getByText("撮影の情報はありません。")).toBeDefined();
});
