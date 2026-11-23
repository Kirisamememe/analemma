import { expect, test } from "bun:test";

import { fieldDefinitions } from "@analemma/contract";

import { createContentForm } from "@/features/fixed-pages/content-form";
import {
  createEditorValues,
  flattenContent,
  restoreContent,
} from "@/features/fixed-pages/editor/flat-content";
import { toFixedPageContent } from "@/features/fixed-pages/to-fixed-page-content";

const name = { key: "name", label: "名前", type: "text" };

const fields = fieldDefinitions.parse([
  { key: "hero", label: "紹介", type: "group", fields: [name] },
  { key: "rows", label: "行", type: "repeat", fields: [name] },
]);

test("各段の定義に無いキーを保ち、現在の並びにある要素の値だけを送る", () => {
  const form = createContentForm(fields, {
    old: 1,
    hero: { other: false },
    rows: [
      { name: "A", extra: 1 },
      { name: "B", extra: 2 },
      { name: "C", extra: 3 },
    ],
  });

  const flat = flattenContent(form);
  const [first, , last] = flat.items["rows"] ?? [];

  if (first === undefined || last === undefined) {
    throw new Error("行が足りません");
  }

  flat.items["rows"] = [last, "new", first];
  flat.content["rows/new/name"] = "追加";
  flat.content[`rows/${last}/name`] = "変更";
  expect(toFixedPageContent(fields, restoreContent(fields, flat))).toEqual({
    old: 1,
    hero: { other: false },
    rows: [
      { name: "変更", extra: 3 },
      { name: "追加" },
      { name: "A", extra: 1 },
    ],
  });
});

test("作成では slug とタイトルを空にし、編集では保存した固定ページの値から始める", () => {
  const created = createEditorValues(fields);

  const edited = createEditorValues(fields, {
    slug: "about",
    title: "紹介",
    content: { hero: { name: "Aoi" }, rows: [{ name: "A" }] },
  });

  const [row] = edited.values.items["rows"] ?? [];

  expect(created.values).toEqual({
    slug: "",
    title: "",
    content: { "hero/name": "" },
    items: { rows: [] },
  });
  expect(edited.values).toEqual({
    slug: "about",
    title: "紹介",
    content: { "hero/name": "Aoi", [`rows/${String(row)}/name`]: "A" },
    items: { rows: [String(row)] },
  });
  expect(edited.fields).toBe(fields);
});
