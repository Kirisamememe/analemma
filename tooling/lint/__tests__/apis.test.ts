import { describe, expect, test } from "bun:test";

import { lintFixture, ruleIdsOf } from "../fixture-lint";

describe("使える API と書き方", () => {
  test.each([
    {
      label: "管理画面の .ts での React の import",
      file: "apps/admin/src/uses-react.ts",
      rule: "eslint(no-restricted-imports)",
    },
    {
      label: "contract での Node の API の import",
      file: "packages/contract/src/uses-node.ts",
      rule: "eslint(no-restricted-imports)",
    },
    {
      label: "console",
      file: "syntax/restricted-apis.ts",
      rule: "eslint(no-console)",
    },
    {
      label: "process.env",
      file: "syntax/restricted-apis.ts",
      rule: "node(no-process-env)",
    },
    {
      label: "引数のプロパティの書き換え",
      file: "syntax/restricted-apis.ts",
      rule: "eslint(no-param-reassign)",
    },
    {
      label: "オブジェクトリテラルへの as",
      file: "syntax/object-literal-assertion.ts",
      rule: "typescript(consistent-type-assertions)",
    },
    {
      label: "u フラグの正規表現",
      file: "syntax/regexp-u-flag.ts",
      rule: "eslint(require-unicode-regexp)",
    },
    {
      label: "失敗を受け止める `.then()` の2つ目の引数",
      file: "syntax/then-with-rejection.ts",
      rule: "promise(prefer-catch)",
    },
    {
      label: "テストでないコードの、ループの中の await",
      file: "syntax/await-in-loop.ts",
      rule: "eslint(no-await-in-loop)",
    },
    {
      label: "server の feature での Drizzle の値の import",
      file: "apps/server/src/features/posts/uses-drizzle.ts",
      rule: "eslint(no-restricted-imports)",
    },
    {
      label: "server の feature での Bun の API",
      file: "apps/server/src/features/posts/uses-bun.ts",
      rule: "eslint(no-restricted-globals)",
    },
    {
      label: "server の feature での素の oRPC の builder",
      file: "apps/server/src/features/posts/uses-raw-builder.ts",
      rule: "eslint(no-restricted-imports)",
    },
    {
      label: "server の feature での bun:sqlite",
      file: "apps/server/src/features/posts/uses-bun-sqlite.ts",
      rule: "eslint(no-restricted-imports)",
    },
    {
      label: "server の feature での globalThis.Bun",
      file: "apps/server/src/features/posts/uses-global-bun.ts",
      rule: "eslint(no-restricted-properties)",
    },
    {
      label: "server の main.ts での Drizzle の値の import",
      file: "apps/server/src/main.ts",
      rule: "eslint(no-restricted-imports)",
    },
  ])("$label に診断を出すこと", ({ file, rule }) => {
    const result = lintFixture(`invalid/${file}`);

    expect(ruleIdsOf(result)).toContain(rule);
    expect(result.status).not.toBe(0);
  });
});

describe("失敗を受け止める場所", () => {
  test("server の feature での try/catch と `.catch()` に、1件ずつ診断を出すこと", () => {
    const result = lintFixture(
      "invalid/apps/server/src/features/posts/catches-error.ts",
    );

    expect(
      ruleIdsOf(result).filter(
        (rule) => rule === "project(no-catch-outside-entry)",
      ),
    ).toHaveLength(2);
  });
});
