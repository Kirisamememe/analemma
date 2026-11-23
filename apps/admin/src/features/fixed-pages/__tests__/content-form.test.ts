import { describe, expect, test } from "bun:test";

import { fieldDefinitions } from "@analemma/contract";

import { createContentForm } from "@/features/fixed-pages/content-form";

const flag = { type: "boolean", key: "flag", label: "表示" };
const fields = fieldDefinitions.parse([
  { type: "text", key: "title", label: "名前" },
  { type: "longText", key: "body", label: "本文" },
  { type: "number", key: "count", label: "件数" },
  flag,
  { ...flag, key: "pinned", default: true },
  { type: "date", key: "day", label: "日付" },
  { type: "url", key: "link", label: "URL" },
  {
    type: "select",
    key: "color",
    label: "色",
    options: [{ value: "red", label: "赤" }],
  },
  { type: "group", key: "details", label: "詳細", fields: [flag] },
  { type: "repeat", key: "rows", label: "行", fields: [flag] },
]);

const emptyValues = {
  title: "",
  body: "",
  count: null,
  flag: false,
  pinned: true,
  day: null,
  link: "",
  color: null,
  details: { values: { flag: false }, unknownKeys: {} },
  rows: [],
};

describe("createContentForm", () => {
  test("新しい固定ページでも、保存した値の無い固定ページでも、入れ子を含め boolean を既定値にする", () => {
    expect(createContentForm(fields).values).toEqual(emptyValues);
    expect(createContentForm(fields, {}).values).toEqual(emptyValues);
  });

  test("contract のスキーマか select の選択肢に合わない保存した値は、未入力に戻し、boolean は既定値にする", () => {
    expect(
      createContentForm(fields, {
        title: "見出し\n改行",
        body: "\u0000",
        count: "1",
        flag: 0,
        pinned: "true",
        day: "2025-02-29",
        link: "ftp://example.com",
        color: "blue",
        details: [],
        rows: {},
      }).values,
    ).toEqual(emptyValues);
  });

  test("object でない repeat の要素は同じ位置に残し、boolean には既定値を使う", () => {
    const rows = createContentForm(fields, {
      rows: [null, [], "旧形式", { flag: true }],
    }).values["rows"];

    if (!Array.isArray(rows)) throw new Error("repeat の値が無い");

    expect(rows.map(({ value }) => value.values["flag"])).toEqual([
      false,
      false,
      false,
      true,
    ]);
    expect(new Set(rows.map(({ id }) => id)).size).toBe(4);
  });
});
