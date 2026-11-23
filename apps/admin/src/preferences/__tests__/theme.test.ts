import { describe, expect, test } from "bun:test";

import { isTheme, toTheme } from "@/preferences/theme";

describe("isTheme", () => {
  test.each(["system", "light", "dark"])(
    "配色の選び方 %s を受け付ける",
    (value) => {
      expect(isTheme(value)).toBe(true);
    },
  );

  test.each(["", "Dark", "auto"])("配色の選び方でない %p を断る", (value) => {
    expect(isTheme(value)).toBe(false);
  });
});

describe("toTheme", () => {
  test.each(["light", "dark"] as const)(
    "html の data-theme の %s を、利用者が選んだ配色にする",
    (value) => {
      expect(toTheme(value)).toBe(value);
    },
  );

  test.each([undefined, "", "sepia"])(
    "html に data-theme が無いか、配色でない %p なら、OS に従う",
    (value) => {
      expect(toTheme(value)).toBe("system");
    },
  );
});
