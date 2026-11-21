import { expect, test } from "bun:test";

import { formatTitle } from "../format-title";

test("前後の空白を取り除くこと", () => {
  expect(formatTitle("  題  ")).toBe("題");
});
