import { expect, test } from "bun:test";

import { clearChangedErrors, contentErrors } from "../editor-errors";
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
    (key) => key,
  );
  expect(errors.fields["content.hero/name"]).toBe(
    "fixedPages.issue.format fixedPages.issue.large",
  );
  expect(clearChangedErrors(errors, "content.hero/name")).toEqual({
    fields: { "content.hero/link": "fixedPages.issue.format" },
    notice: "fixedPages.changedKind hero/name — fixedPages.issue.format",
  });
});
