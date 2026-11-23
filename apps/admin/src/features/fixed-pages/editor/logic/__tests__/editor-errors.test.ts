import { expect, test } from "bun:test";

import {
  clearChangedErrors,
  contentErrors,
  type RefusedSave,
  refusedSaveErrors,
} from "../editor-errors";

const t = (key: string, values?: object) =>
  values === undefined ? key : `${key}(${Object.values(values).join(",")})`;

test("同じ項目の issue をまとめ、結べない issue を Toast の文にし、値を変えたらその項目と親の知らせを消す", () => {
  const issue = {
    code: "invalid_format",
    path: ["hero", "name"],
    message: "Invalid",
  };

  const errors = contentErrors(
    {
      bound: [
        { location: ["hero", "name"], issue },
        { location: ["hero", "name"], issue: { ...issue, code: "too_big" } },
        { location: ["hero"], issue },
        { location: ["hero", "link"], issue },
      ],
      unbound: [issue],
    },
    t,
  );

  expect(errors.fields["content.hero/name"]).toBe(
    "fixedPageEditor.issue.format fixedPageEditor.issue.large",
  );
  expect(errors.fields["content.hero"]).toBe("fixedPageEditor.issue.format");
  expect(errors.message).toBe(
    "fixedPageEditor.changedKind fixedPageEditor.unboundIssue(hero/name,fixedPageEditor.issue.format)",
  );
  expect(clearChangedErrors(errors.fields, "content.hero/name")).toEqual({
    "content.hero/link": "fixedPageEditor.issue.format",
  });
});

test.each<[Parameters<typeof refusedSaveErrors>[0], RefusedSave]>([
  [
    { _tag: "SLUG_TAKEN" },
    {
      fields: { slug: "fixedPageEditor.slugTaken" },
      message: "fixedPageEditor.slugTaken",
    },
  ],
  [{ _tag: "NOT_FOUND" }, { fields: {}, message: "fixedPageEditor.pageGone" }],
  [
    { _tag: "UNKNOWN_KIND" },
    { fields: {}, message: "fixedPageEditor.kindGone" },
  ],
  [
    {
      _tag: "InvalidContent",
      issues: {
        bound: [
          {
            location: ["lead"],
            issue: { code: "too_big", path: ["lead"], message: "" },
          },
        ],
        unbound: [],
      },
    },
    {
      fields: { "content.lead": "fixedPageEditor.issue.large" },
      message: "fixedPageEditor.invalidContent",
    },
  ],
])(
  "断られた保存の %o を、欄の知らせと失敗の Toast の文にする",
  (result, errors) => {
    expect(refusedSaveErrors(result, t)).toEqual(errors);
  },
);
