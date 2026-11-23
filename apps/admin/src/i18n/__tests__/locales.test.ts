import { describe, expect, test } from "bun:test";

import { isLocale, localeName, toLocale } from "@/i18n/locales";

describe("isLocale", () => {
  test.each(["en", "ja", "zh-Hans"])("対応する言語 %s を受け付ける", (tag) => {
    expect(isLocale(tag)).toBe(true);
  });

  test.each(["", "EN", "ja-JP", "zh", "zh-Hant", "fr"])(
    "対応していない tag %p を断る",
    (tag) => {
      expect(isLocale(tag)).toBe(false);
    },
  );
});

describe("toLocale", () => {
  test("対応する言語は、そのまま使う", () => {
    expect(toLocale("zh-Hans")).toBe("zh-Hans");
  });

  test("lang が空や、対応していない言語なら、英語にする", () => {
    expect(toLocale("")).toBe("en");
    expect(toLocale("fr")).toBe("en");
  });
});

describe("localeName", () => {
  test.each([
    ["en", "English"],
    ["ja", "日本語"],
    ["zh-Hans", "简体中文"],
  ] as const)("%s を、その言語で書いた名前 %s にする", (locale, name) => {
    expect(localeName(locale)).toBe(name);
  });
});
