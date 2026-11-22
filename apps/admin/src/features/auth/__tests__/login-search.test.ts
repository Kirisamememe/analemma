import { describe, expect, test } from "bun:test";

import { isPublicPath, toLoginSearch } from "@/features/auth/login-search";

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
    "/LOGIN",
    "/enroll#abc.def",
    "/Enroll",
  ])("外やログインの画面への行き先 %p は捨てる", (redirect) => {
    expect(toLoginSearch({ redirect })).toEqual({});
  });

  test("文字列でない行き先は捨てる", () => {
    expect(toLoginSearch({ redirect: 42 })).toEqual({});
    expect(toLoginSearch({})).toEqual({});
  });
});

describe("isPublicPath", () => {
  test.each([
    "/login",
    "/login?redirect=/",
    "/LOGIN",
    "/enroll",
    "/enroll#token",
  ])("ログインの前に開く画面のパス %p を見分ける", (path) => {
    expect(isPublicPath(path)).toBe(true);
  });

  test.each(["/", "/pages", "/login-history", "/enrollments"])(
    "ログインした後の画面のパス %p は、ログインの前の画面と見なさない",
    (path) => {
      expect(isPublicPath(path)).toBe(false);
    },
  );
});
