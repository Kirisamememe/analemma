import { expect, test } from "bun:test";

import { trimValue } from "../trim-value";

test("前後の空白を取り除くこと", () => {
  expect(trimValue(" 題 ")).toBe("題");
});
