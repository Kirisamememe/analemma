import { expect, test } from "bun:test";

import { seriesImageLabel } from "../series-image-label";

import { createI18n } from "@/i18n/create-i18n";

test("タイトル、alt、撮影日と位置、位置だけの順に画像を見分ける名前を選ぶ", () => {
  const { t } = createI18n("ja");

  const image = {
    title: "タイトル",
    alt: "画像の説明",
    takenAt: "2025-04-28T06:10:00",
  };

  expect(seriesImageLabel(image, { position: 3, locale: "ja", t })).toBe(
    "タイトル",
  );
  expect(
    seriesImageLabel(
      { ...image, title: null },
      { position: 3, locale: "ja", t },
    ),
  ).toBe("画像の説明");
  expect(
    seriesImageLabel(
      { ...image, title: null, alt: null },
      { position: 3, locale: "ja", t },
    ),
  ).toMatch(/2025.*4.*28.*3 枚目/v);
  expect(
    seriesImageLabel(
      { title: null, alt: null, takenAt: null },
      { position: 4, locale: "ja", t },
    ),
  ).toMatch(/無題.*4 枚目/v);
});
