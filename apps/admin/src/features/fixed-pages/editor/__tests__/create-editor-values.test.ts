import { expect, test } from "bun:test";

import { fieldDefinitions } from "@analemma/contract";

import { createEditorValues } from "../create-editor-values";

const name = { key: "name", label: "名前", type: "text" };

const fields = fieldDefinitions.parse([
  { key: "hero", label: "紹介", type: "group", fields: [name] },
  { key: "rows", label: "行", type: "repeat", fields: [name] },
]);

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
