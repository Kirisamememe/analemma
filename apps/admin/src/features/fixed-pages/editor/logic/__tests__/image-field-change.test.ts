import { expect, test } from "bun:test";

import { changeImageField } from "../image-field-change";

test("選択とキャンセルで元の値を保ち、確定と取り外しで値を変える", () => {
  const id = "019b0000-0000-7000-8000-0000000000ff";
  const selected = { open: false, value: id };
  expect(changeImageField(id, "choose")).toEqual({ ...selected, open: true });
  expect(changeImageField(id, "cancel")).toEqual(selected);
  expect(changeImageField(null, { id })).toEqual(selected);
  expect(changeImageField(id, "remove")).toEqual({ open: false, value: null });
  expect(changeImageField(id.toUpperCase(), { id }).value).toBe(
    id.toUpperCase(),
  );
});
