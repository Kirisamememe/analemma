import { describe, expect, test } from "bun:test";

import { toLocale } from "../to-locale";

describe("toLocale", () => {
  test("管理画面が持つ言語は、そのまま使う", () => {
    expect(toLocale("zh-Hans")).toBe("zh-Hans");
  });

  test("lang が空や、持たない言語なら、英語にする", () => {
    expect(toLocale("")).toBe("en");
    expect(toLocale("fr")).toBe("en");
  });
});
