import { expect, test } from "bun:test";

import { changeImageField } from "../image-field-change";

test("選択中とキャンセル時は元の画像を保ち、確定と取り外しで値を変える", () => {
  const id = "019b0000-0000-7000-8000-0000000000ff";
  expect(changeImageField(id, { type: "choose" })).toEqual({
    open: true,
    value: id,
  });
  expect(changeImageField(id, { type: "cancel" })).toEqual({
    open: false,
    value: id,
  });
  expect(changeImageField(null, { type: "confirm", id })).toEqual({
    open: false,
    value: id,
  });
  expect(changeImageField(id, { type: "remove" })).toEqual({
    open: false,
    value: null,
  });
  expect(
    changeImageField(id.toUpperCase(), { type: "confirm", id }).value,
  ).toBe(id.toUpperCase());
});
