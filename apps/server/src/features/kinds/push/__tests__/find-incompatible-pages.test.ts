import { expect, test } from "bun:test";

import { kindDefinition } from "@analemma/contract";

import { findIncompatiblePages } from "../find-incompatible-pages";

const profile = kindDefinition.parse({
  name: "profile",
  label: "自己紹介",
  fields: [{ key: "age", label: "年", type: "number", optional: true }],
});

const page = (id: string, content: unknown) => ({
  id,
  kind: "profile",
  slug: id,
  title: id,
  content,
});

test("送った定義に合わないページだけを、合わない場所と一緒に選び、送っていない種類のページは見ないこと", () => {
  expect(
    findIncompatiblePages({
      definitions: [profile],
      pages: [
        page("empty", {}),
        page("number", { age: 30 }),
        page("text", { age: "30", removed: "古い項目" }),
        { ...page("other", { age: "30" }), kind: "colophon" },
      ],
    }),
  ).toMatchObject([
    {
      kind: "profile",
      id: "text",
      issues: [{ path: ["age"], code: "invalid_type" }],
    },
  ]);
});
