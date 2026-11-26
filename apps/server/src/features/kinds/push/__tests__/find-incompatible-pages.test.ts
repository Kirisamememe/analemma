import { expect, test } from "bun:test";

import { kindDefinition } from "@analemma/contract";

import { findIncompatiblePages } from "@/features/kinds/push/find-incompatible-pages";

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

test("画像の項目の追加・必須への変更・削除・型の変更は、保存した値が新しい定義に合うかで決めること", () => {
  const photo = { type: "image", key: "photo", label: "写真" } as const;

  const pages = [
    page("empty", {}),
    page("photo", { photo: crypto.randomUUID() }),
    page("text", { photo: "海" }),
  ];

  const incompatible = (fields: typeof profile.fields) =>
    findIncompatiblePages({ definitions: [{ ...profile, fields }], pages }).map(
      ({ id }) => id,
    );

  expect(incompatible([{ ...photo, optional: true }])).toEqual(["text"]);
  expect(incompatible([{ ...photo, optional: false }])).toEqual([
    "empty",
    "text",
  ]);
  expect(incompatible([])).toEqual([]);
  expect(incompatible([{ ...photo, type: "number", optional: true }])).toEqual([
    "photo",
    "text",
  ]);
});
