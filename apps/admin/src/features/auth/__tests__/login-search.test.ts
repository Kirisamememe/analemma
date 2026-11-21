import { describe, expect, test } from "bun:test";

import { toLoginSearch } from "../login-search";

describe("toLoginSearch", () => {
  test("管理画面の中のパスは、ログインした後の行き先として残す", () => {
    expect(toLoginSearch({ redirect: "/pages?kind=about#top" })).toEqual({
      redirect: "/pages?kind=about#top",
    });
  });

  test.each([
    "https://example.com/",
    "//example.com/",
    "/\\example.com",
    "pages",
    "/login",
    "/login?redirect=/",
  ])("外やログインの画面への行き先 %p は捨てる", (redirect) => {
    expect(toLoginSearch({ redirect })).toEqual({});
  });

  test("文字列でない行き先は捨てる", () => {
    expect(toLoginSearch({ redirect: 42 })).toEqual({});
    expect(toLoginSearch({})).toEqual({});
  });
});
