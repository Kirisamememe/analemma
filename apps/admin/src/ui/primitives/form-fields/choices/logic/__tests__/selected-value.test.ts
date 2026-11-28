import { expect, test } from "bun:test";

import { toSelectedValue } from "../selected-value";

test("文字列の key は、そのまま選んだ値にする", () => {
  expect(toSelectedValue("published")).toBe("published");
});

test("未選択を表す空の key と null は、値なしにする", () => {
  expect(toSelectedValue("")).toBeNull();
  expect(toSelectedValue(null)).toBeNull();
});

test("数の key は、選択肢の値ではないので、値なしにする", () => {
  expect(toSelectedValue(0)).toBeNull();
});
