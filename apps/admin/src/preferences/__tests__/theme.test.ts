import { describe, expect, test } from "bun:test";

import { isTheme } from "@/preferences/theme";

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
