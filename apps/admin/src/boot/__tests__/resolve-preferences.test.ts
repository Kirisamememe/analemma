import { describe, expect, test } from "bun:test";

import { resolvePreferences } from "../resolve-preferences";

describe("resolvePreferences", () => {
  test("何も置いていなければ、ブラウザの言語と OS の配色に従う", () => {
    expect(
      resolvePreferences({ locale: null, theme: null }, ["ja-JP", "en-US"]),
    ).toEqual({ locale: "ja", theme: "system" });
  });

  test("利用者が選んだ言語と配色を、ブラウザの言語より優先する", () => {
    expect(
      resolvePreferences({ locale: "zh-Hans", theme: "dark" }, ["ja-JP"]),
    ).toEqual({ locale: "zh-Hans", theme: "dark" });
  });

  test("Intl.Locale が読めない言語が先にあっても、言語と配色を両方決める", () => {
    expect(
      resolvePreferences({ locale: null, theme: "dark" }, ["i-klingon", "ja"]),
    ).toEqual({ locale: "ja", theme: "dark" });
  });

  test("置いてあった値が持たないものなら、置いていないときと同じにする", () => {
    expect(
      resolvePreferences({ locale: "fr", theme: "sepia" }, ["en-GB"]),
    ).toEqual({ locale: "en", theme: "system" });
  });
});
