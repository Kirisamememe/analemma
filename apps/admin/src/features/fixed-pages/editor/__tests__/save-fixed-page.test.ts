import { expect, test } from "bun:test";

import { fieldDefinitions } from "@analemma/contract";

import { createContentForm } from "../../content-form";
import { saveFixedPage } from "../save-fixed-page";

import { createFakeApi } from "@/testing/create-fake-api";

test("編集時の issue の添え字を、送った時点の要素の ID に結ぶ", async () => {
  const fields = fieldDefinitions.parse([
    {
      type: "repeat",
      key: "rows",
      label: "行",
      fields: [{ type: "text", key: "name", label: "名前" }],
    },
  ]);
  const submitted = createContentForm(fields, { rows: [{}, {}] });
  const rows = submitted.values["rows"];

  if (!Array.isArray(rows) || rows[1] === undefined) {
    throw new Error("行がありません");
  }

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
    target: { id: "019affff-0000-7000-8000-000000000001" },
    slug: "about",
    title: "紹介",
    fields,
    submitted,
  });
  expect(result).toEqual({
    _tag: "InvalidContent",
    issues: {
      bound: [{ location: ["rows", rows[1].id, "name"], issue }],
      unbound: [],
    },
  });
});
