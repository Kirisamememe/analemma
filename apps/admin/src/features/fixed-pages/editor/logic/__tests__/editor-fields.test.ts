import { describe, expect, test } from "bun:test";

import { fieldDefinitions } from "@analemma/contract";

import {
  fieldsChangedSinceEditing,
  fieldsInUse,
  holdWhileDeleting,
  holdWhileEditing,
  pageInUse,
} from "../editor-fields";

import { page } from "@/testing/fixed-page-samples";

const first = fieldDefinitions.parse([
  { type: "text", key: "name", label: "名前" },
]);

const second = fieldDefinitions.parse([
  { type: "text", key: "title", label: "見出し" },
]);

describe("holdWhileEditing", () => {
  test("入力中は始めたときの項目を保ち、替わったことを知らせ、入力が無くなったら新しい項目にする", () => {
    const editing = holdWhileEditing({}, { editing: true, latest: first });

    expect(fieldsInUse(editing, second)).toEqual(first);
    expect(fieldsChangedSinceEditing(editing, second)).toBe(true);

    const done = holdWhileEditing(editing, {
      editing: false,
      latest: second,
    });

    expect(fieldsInUse(done, second)).toEqual(second);
  });

  test("入力を続けても、保つものは替えない", () => {
    const fields = first;
    const editing = holdWhileEditing({}, { editing: true, latest: fields });

    expect(holdWhileEditing(editing, { editing: true, latest: fields })).toBe(
      editing,
    );
    expect(fieldsChangedSinceEditing(editing, fields)).toBe(false);
  });
});

describe("holdWhileDeleting", () => {
  test("削除を確かめる間は、項目を替えない", () => {
    const fields = first;
    const deleting = holdWhileDeleting({}, { open: true, latest: fields });

    expect(fieldsInUse(deleting, second)).toBe(fields);
    expect(
      fieldsInUse(
        holdWhileDeleting(deleting, { open: false, latest: fields }),
        [...second],
      ),
    ).toEqual(second);
  });
});

describe("pageInUse", () => {
  test("保存を送った時点のページの間は、保存できた後のページを使う", () => {
    const saved = { ...page, title: "保存した" };
    const hold = { acknowledged: { before: page, saved } };

    expect(pageInUse(hold, page)).toBe(saved);
    expect(pageInUse(hold, { ...page })).not.toBe(saved);
  });
});
