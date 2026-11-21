import { describe, expect, test } from "bun:test";

import { createTranslate } from "../translate";

describe("createTranslate", () => {
  test("言語ごとの訳を引く", () => {
    expect(createTranslate("en")("notFound.title")).toBe("Page not found");
    expect(createTranslate("ja")("notFound.title")).toBe(
      "ページが見つかりません",
    );
  });

  test("{name} に引数を入れる", () => {
    expect(
      createTranslate("ja")("notFound.description", { path: "/pages" }),
    ).toBe("/pages にページはありません。");
  });

  test("引数には数も渡せる", () => {
    expect(createTranslate("en")("notFound.description", { path: 42 })).toBe(
      "There is no page at 42.",
    );
  });
});
