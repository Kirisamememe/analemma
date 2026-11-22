import { describe, expect, test } from "bun:test";

import {
  type FieldDefinition,
  contentIssues,
  fieldDefinitions,
  toContentSchema,
} from "@analemma/contract";

import { bindContentIssues } from "@/features/fixed-pages/bind-content-issues";
import { createContentForm } from "@/features/fixed-pages/content-form";
import { toFixedPageContent } from "@/features/fixed-pages/to-fixed-page-content";

const title = { key: "title", type: "text", label: "見出し" };
const group = { key: "details", type: "group", label: "詳細", fields: [title] };
const repeat = { key: "rows", type: "repeat", label: "行", fields: [group] };
const fields = fieldDefinitions.parse([title, group, repeat]);

const issuesFor = (
  definitions: readonly FieldDefinition[],
  content: unknown,
) => {
  const result = toContentSchema({
    fields: definitions,
    unknownKeys: "keep",
  }).safeParse(content);

  if (result.success) throw new Error("中身が検査を通った");

  return contentIssues.parse(result.error.issues);
};

describe("bindContentIssues", () => {
  test("並べ替えて送った repeat の添え字を、そのときの要素の ID に置き換える", () => {
    const form = createContentForm(fields, {
      title: "表紙",
      details: {},
      rows: [{ details: {} }, { details: { title: "末尾" } }],
    });
    const items = form.values["rows"];

    if (!Array.isArray(items) || items[0] === undefined) {
      throw new Error("repeat の先頭に要素が無い");
    }

    const submitted = {
      ...form,
      values: { ...form.values, rows: items.toReversed() },
    };
    const issues = issuesFor(fields, toFixedPageContent(fields, submitted));
    expect(issues.map(({ path }) => path)).toEqual([
      ["details", "title"],
      ["rows", 1, "details", "title"],
    ]);
    const result = bindContentIssues({ fields, submitted }, issues);
    expect(result.bound.map(({ location }) => location)).toEqual([
      ["details", "title"],
      ["rows", items[0].id, "details", "title"],
    ]);
    expect(result.bound.map(({ issue }) => issue)).toEqual(issues);
    expect(result.unbound).toEqual([]);
  });

  test("group・repeat・repeat の要素を指す issue はその場所に結ぶ", () => {
    const submitted = createContentForm(fields, { rows: [{}] });
    const items = submitted.values["rows"];

    if (!Array.isArray(items) || items[0] === undefined) {
      throw new Error("repeat の先頭に要素が無い");
    }

    const issues = [
      ...issuesFor(fields, { title: "本文" }),
      ...issuesFor(fields, {
        title: "本文",
        details: { title: "詳細" },
        rows: [null],
      }),
    ];
    const result = bindContentIssues({ fields, submitted }, issues);
    expect(result.bound.map(({ location }) => location)).toEqual([
      ["details"],
      ["rows"],
      ["rows", items[0].id],
    ]);
    expect(result.bound.map(({ issue }) => issue)).toEqual(issues);
    expect(result.unbound).toEqual([]);
  });

  test("送ったフォームに結べる issue と結べない issue を、それぞれ元の順で返す", () => {
    const submitted = createContentForm(fields);
    const otherFields = fieldDefinitions.parse([
      { ...group, key: "old" },
      { ...group, key: "title" },
      { ...repeat, key: "details" },
      { ...group, key: "rows" },
    ]);
    const unbound = [
      ...issuesFor(fields, null),
      ...issuesFor(otherFields, { title: {}, details: [null], rows: {} }),
      ...issuesFor(fields, {
        title: "本文",
        details: { title: "詳細" },
        rows: [{}],
      }),
    ];
    const bound = issuesFor(fields, { details: {}, rows: [] });
    const issues = [...unbound, ...bound];
    expect(unbound.map(({ path }) => path)).toEqual([
      [],
      ["old"],
      ["title", "title"],
      ["details", 0],
      ["rows", "title"],
      ["rows", 0, "details"],
    ]);
    const result = bindContentIssues({ fields, submitted }, issues);
    expect(result.bound.map(({ location }) => location)).toEqual([
      ["title"],
      ["details", "title"],
    ]);
    expect(result.bound.map(({ issue }) => issue)).toEqual(bound);
    expect(result.unbound).toEqual(unbound);
  });
});
