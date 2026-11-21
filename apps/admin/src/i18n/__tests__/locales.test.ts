import { describe, expect, test } from "bun:test";

import { isLocale } from "../locales";

describe("isLocale", () => {
  test.each(["en", "ja", "zh-Hans"])(
    "管理画面が持つ言語 %s を受け付ける",
    (tag) => {
      expect(isLocale(tag)).toBe(true);
    },
  );

  test.each(["", "EN", "ja-JP", "zh", "zh-Hant", "fr"])(
    "管理画面が持たない tag %p を断る",
    (tag) => {
      expect(isLocale(tag)).toBe(false);
    },
  );
});
