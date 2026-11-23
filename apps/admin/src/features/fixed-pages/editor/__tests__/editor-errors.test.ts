import { expect, test } from "bun:test";

import {
  clearChangedErrors,
  contentErrors,
  type EditorErrors,
  refusedSaveErrors,
} from "../editor-errors";

const t = (key: string, values?: object) =>
  values === undefined ? key : `${key}(${Object.values(values).join(",")})`;

test("同じ項目の issue をまとめ、値を変えたらその項目と親の知らせを消す", () => {
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
  expect(clearChangedErrors(errors, "content.hero/name")).toEqual({
    fields: { "content.hero/link": "fixedPageEditor.issue.format" },
    notice:
      "fixedPageEditor.changedKind fixedPageEditor.unboundIssue(hero/name,fixedPageEditor.issue.format)",
  });
});

test.each<[Parameters<typeof refusedSaveErrors>[0], EditorErrors]>([
  [{ _tag: "SLUG_TAKEN" }, { fields: { slug: "fixedPageEditor.slugTaken" } }],
  [{ _tag: "NOT_FOUND" }, { fields: {}, notice: "fixedPageEditor.pageGone" }],
  [
    { _tag: "UNKNOWN_KIND" },
    { fields: {}, notice: "fixedPageEditor.kindGone" },
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
    { fields: { "content.lead": "fixedPageEditor.issue.large" } },
  ],
])("断られた保存の %o を、欄とフォーム全体の知らせにする", (result, errors) => {
  expect(refusedSaveErrors(result, t)).toEqual(errors);
});
