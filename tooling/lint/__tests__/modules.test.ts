import { describe, expect, test } from "bun:test";

import { lintFixture, ruleIdsOf } from "../fixture-lint";

describe("関数の形と数", () => {
  test.each([
    {
      label: "コードが201行のファイルで export した3つの関数",
      file: "functions/three-functions-in-201-lines.ts",
      rule: "project(max-exported-functions)",
    },
    {
      label: "function 宣言",
      file: "functions/function-declaration.ts",
      rule: "prefer-arrow-functions(prefer-arrow-functions)",
    },
    {
      label: "引数のインラインのオブジェクト型",
      file: "functions/inline-parameter-type.ts",
      rule: "project(no-inline-parameter-type)",
    },
    {
      label: "3つの位置引数",
      file: "functions/three-params.ts",
      rule: "eslint(max-params)",
    },
  ])("$label に診断を出すこと", ({ file, rule }) => {
    const result = lintFixture(`invalid/${file}`);

    expect(ruleIdsOf(result)).toContain(rule);
    expect(result.status).not.toBe(0);
  });

  test("function 宣言には、export した関数の数の診断を出さないこと", () => {
    const result = lintFixture("invalid/functions/function-declaration.ts");

    expect(ruleIdsOf(result)).not.toContain("project(max-exported-functions)");
  });
});

describe("TSDoc の必須条件", () => {
  test.each([
    {
      label: "TSDoc の無い、export した関数",
      file: "jsdoc/missing-function.ts",
      rule: "jsdoc-js(require-jsdoc)",
    },
    {
      label: "TSDoc の無い、export した型",
      file: "jsdoc/missing-type.ts",
      rule: "jsdoc-js(require-jsdoc)",
    },
    {
      label: "TSDoc の無い、オブジェクト引数の項目",
      file: "jsdoc/missing-param-property.ts",
      rule: "jsdoc-type(require-jsdoc)",
    },
    {
      label: "TSDoc の無い、型のプロパティ",
      file: "jsdoc/missing-property.ts",
      rule: "jsdoc-type(require-jsdoc)",
    },
  ])("$label に診断を出すこと", ({ file, rule }) => {
    const result = lintFixture(`invalid/${file}`);

    expect(ruleIdsOf(result)).toContain(rule);
    expect(result.status).not.toBe(0);
  });
});

describe("import の形", () => {
  test.each([
    {
      label: "同じモジュールの型と値を別の import 文に分けること",
      file: "imports/split-import.ts",
      rule: "import(no-duplicates)",
    },
    {
      label: "スクリプトの拡張子の付いた相対 import",
      file: "imports/script-extension.ts",
      rule: "import(extensions)",
    },
    {
      label: "Node が読む設定のファイルの、拡張子の無い相対 import",
      file: "tooling/lint/config/without-extension.ts",
      rule: "import(extensions)",
    },
    {
      label: "`import()` による動的な import",
      file: "imports/dynamic-import.ts",
      rule: "project(no-dynamic-import)",
    },
    {
      label: "相対パスでほかのワークスペースへ入る import",
      file: "packages/contract/src/imports-server.ts",
      rule: "project(no-cross-workspace-import)",
    },
  ])("$label に診断を出すこと", ({ file, rule }) => {
    const result = lintFixture(`invalid/${file}`);

    expect(ruleIdsOf(result)).toContain(rule);
    expect(result.status).not.toBe(0);
  });

  test("管理画面で別名を使ってワークスペースの外を指す import と re-export に診断を出すこと", () => {
    const result = lintFixture(
      "invalid/apps/admin/src/imports-server-by-alias.ts",
    );

    expect(
      result.diagnostics
        .filter(({ code }) => code === "project(no-cross-workspace-import)")
        .map(({ line }) => line),
    ).toEqual([1, 3]);
  });
});
