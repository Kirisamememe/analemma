import { describe, expect, test } from "bun:test";

import { fieldDefinitions } from "@analemma/contract";

import { createEditorValues } from "../../create-editor-values";
import { hasUnsavedChanges } from "../save-input";

const name = { type: "text", key: "name", label: "名前" };
const fields = fieldDefinitions.parse([
  { type: "text", key: "lead", label: "リード文", optional: true },
  { type: "repeat", key: "rows", label: "行", fields: [name] },
]);

describe("hasUnsavedChanges", () => {
  const { values: saved, ...base } = createEditorValues(fields, {
    slug: "about",
    title: "紹介",
    content: { legacy: 1, rows: [{ name: "A" }, { name: "B" }] },
  });
  const [first, second] = saved.items["rows"] ?? [];

  test("保存で送る値が同じなら、送らない未入力の違いがあっても変わっていない", () => {
    expect(hasUnsavedChanges(base, { saved, current: saved })).toBe(false);
    expect(
      hasUnsavedChanges(base, {
        saved,
        current: { ...saved, content: { ...saved.content, lead: "" } },
      }),
    ).toBe(false);
  });

  test.each([
    ["slug", { ...saved, slug: "profile" }],
    [
      "項目の値",
      { ...saved, content: { ...saved.content, lead: "こんにちは" } },
    ],
    [
      "repeat の並び",
      { ...saved, items: { rows: [String(second), String(first)] } },
    ],
  ])("%s が変わったら、変わったとする", (_, current) => {
    expect(hasUnsavedChanges(base, { saved, current })).toBe(true);
  });
});
