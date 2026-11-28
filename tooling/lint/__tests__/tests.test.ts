import { describe, expect, test } from "bun:test";

import { lintFixture, ruleIdsOf } from "../fixture-lint";

const countRule = (file: string, rule: string): number =>
  ruleIdsOf(lintFixture(`invalid/${file}`)).filter((id) => id === rule).length;

describe("テストの置き場所", () => {
  test.each([
    { label: "__tests__ の外にあるテスト", file: "tests/misplaced.test.ts" },
    {
      label: "__tests__ の中にある、テストでないファイル",
      file: "tests/__tests__/helper.ts",
    },
    {
      label: "__tests__ の中のフォルダにあるテスト",
      file: "tests/__tests__/deep/nested.test.ts",
    },
  ])("$label に診断を出すこと", ({ file }) => {
    expect(countRule(file, "project(test-location)")).toBe(1);
  });

  test.each([
    {
      label: "テストの無い管理画面のロジック",
      file: "apps/admin/src/untested.ts",
    },
    {
      label: "テストの中身が空の管理画面のロジック",
      file: "apps/admin/src/empty-test.ts",
    },
    {
      label: "テストの無い hook",
      file: "apps/admin/src/use-title.ts",
    },
  ])("$label に診断を出すこと", ({ file }) => {
    expect(countRule(file, "project(require-sibling-test)")).toBe(1);
  });
});

describe("テストの書き方", () => {
  test("マークアップの作りに依存する5つの書き方に、1つずつ診断を出すこと", () => {
    expect(
      countRule(
        "tests/__tests__/markup-test.test.tsx",
        "project(no-markup-test)",
      ),
    ).toBe(5);
  });

  test("only・skip・if に1つずつ診断を出すこと", () => {
    expect(
      countRule(
        "tests/__tests__/focused-test.test.ts",
        "project(no-focused-test)",
      ),
    ).toBe(3);
  });
});
