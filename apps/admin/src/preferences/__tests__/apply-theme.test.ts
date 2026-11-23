import { afterEach, describe, expect, test } from "bun:test";

import { applyTheme } from "@/preferences/apply-theme";

afterEach(() => {
  delete document.documentElement.dataset["theme"];
});

describe("applyTheme", () => {
  test("ライトかダークを選んだら、html の data-theme で固定する", () => {
    applyTheme("dark");
    expect(document.documentElement.dataset["theme"]).toBe("dark");

    applyTheme("light");
    expect(document.documentElement.dataset["theme"]).toBe("light");
  });

  test("自動を選んだら、html の data-theme を外して OS に従わせる", () => {
    applyTheme("dark");
    applyTheme("system");

    expect(document.documentElement.dataset["theme"]).toBeUndefined();
  });
});
