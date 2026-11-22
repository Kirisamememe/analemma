import { describe, expect, test } from "bun:test";

import { pickMessage } from "../pick-message";

describe("pickMessage", () => {
  test("訳にあるキーは、その訳を使う", () => {
    expect(
      pickMessage({ "notFound.title": "見つからない" }, "notFound.title"),
    ).toBe("見つからない");
  });

  test("訳していないキーは、英語の訳を使う", () => {
    expect(pickMessage({}, "notFound.title")).toBe("Page not found");
  });
});
