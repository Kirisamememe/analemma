import { describe, expect, test } from "bun:test";

import { negotiateLocale } from "../negotiate-locale";

describe("negotiateLocale", () => {
  test.each([
    { requested: ["ja-JP"], expected: "ja" },
    { requested: ["en-GB"], expected: "en" },
    { requested: ["zh-CN"], expected: "zh-Hans" },
    { requested: ["zh-SG"], expected: "zh-Hans" },
    { requested: ["zh"], expected: "zh-Hans" },
    { requested: ["zh-Hans-HK"], expected: "zh-Hans" },
  ])(
    "地域の付いた言語 $requested を、同じ言語と文字の $expected にする",
    ({ requested, expected }) => {
      expect(negotiateLocale(requested)).toBe(expected);
    },
  );

  test.each(["zh-TW", "zh-HK", "zh-Hant"])(
    "繁体字の %s は、簡体字に寄せない",
    (tag) => {
      expect(negotiateLocale([tag])).toBe("en");
    },
  );

  test("持たない言語を飛ばし、並びの先にある、持っている言語を選ぶ", () => {
    expect(negotiateLocale(["fr-FR", "zh-TW", "ja", "en"])).toBe("ja");
  });

  test("どれも持たなければ、英語にする", () => {
    expect(negotiateLocale(["fr", "de"])).toBe("en");
    expect(negotiateLocale([])).toBe("en");
  });
});
