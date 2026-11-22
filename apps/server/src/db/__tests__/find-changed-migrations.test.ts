import { expect, test } from "bun:test";

import { findChangedMigrations } from "@/db/find-changed-migrations";

const applied = [
  { name: "20260101000000_create-notes", hash: "a" },
  { name: "20260102000000_add-title", hash: "b" },
];

test("適用済みのものがそのままで、新しいものが足されただけなら、何も返さないこと", () => {
  expect(
    findChangedMigrations(applied, [
      ...applied,
      { name: "20260103000000_add-tags", hash: "c" },
    ]),
  ).toEqual({ rewritten: [], missing: [] });
});

test("SQL が書き換えられたものと、フォルダから消えたものを分けて返すこと", () => {
  expect(
    findChangedMigrations(applied, [
      { name: "20260101000000_create-notes", hash: "changed" },
      { name: "20260102000000_add-heading", hash: "b" },
    ]),
  ).toEqual({
    rewritten: ["20260101000000_create-notes"],
    missing: ["20260102000000_add-title"],
  });
});
