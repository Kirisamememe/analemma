import { expect, test } from "bun:test";

import { fieldDefinitions } from "@analemma/contract";

import { createEditorValues } from "../../create-editor-values";
import { saveFixedPage } from "../save-fixed-page";

import { createFakeApi } from "@/testing/create-fake-api";

const name = { type: "text", key: "name", label: "名前" };
const fields = fieldDefinitions.parse([
  { type: "text", key: "lead", label: "リード文", optional: true },
  { type: "repeat", key: "rows", label: "行", fields: [name] },
]);

test("編集時の issue の添え字を、送った時点の要素の ID に結ぶ", async () => {
  const { values, ...base } = createEditorValues(fields, {
    slug: "about",
    title: "紹介",
    content: { rows: [{}, {}] },
  });
  const [, second] = values.items["rows"] ?? [];
  const issue = {
    path: ["rows", 1, "name"],
    code: "invalid_type",
    message: "Invalid",
  };
  const { api } = createFakeApi({
    "admin/fixedPages/update": () => ({
      error: "INVALID_CONTENT",
      data: { issues: [issue] },
    }),
  });
  const result = await saveFixedPage(api, {
    ...base,
    target: { id: "019affff-0000-7000-8000-000000000001" },
    values,
  });
  expect(result).toEqual({
    _tag: "InvalidContent",
    issues: {
      bound: [{ location: ["rows", String(second), "name"], issue }],
      unbound: [],
    },
  });
});
