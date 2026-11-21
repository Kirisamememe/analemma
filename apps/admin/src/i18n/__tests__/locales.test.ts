import { describe, expect, test } from "bun:test";

import { isLocale, toLocale } from "../locales";

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

describe("toLocale", () => {
  test("管理画面が持つ言語は、そのまま使う", () => {
    expect(toLocale("zh-Hans")).toBe("zh-Hans");
  });

  test("lang が空や、持たない言語なら、英語にする", () => {
    expect(toLocale("")).toBe("en");
    expect(toLocale("fr")).toBe("en");
  });
});
