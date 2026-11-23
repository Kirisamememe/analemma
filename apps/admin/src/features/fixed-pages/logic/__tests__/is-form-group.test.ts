import { expect, test } from "bun:test";

import { isFormGroup } from "../is-form-group";

test("group の値だけを、repeat の並びと項目の値から見分けること", () => {
  expect(isFormGroup({ values: {}, unknownKeys: {} })).toBe(true);
  expect(isFormGroup([])).toBe(false);
  expect(isFormGroup("題")).toBe(false);
  expect(isFormGroup(null)).toBe(false);
  expect(isFormGroup(undefined)).toBe(false);
});
