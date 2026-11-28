import { describe, expect, test } from "bun:test";

import { lintFixture, ruleIdsOf } from "../fixture-lint";

describe("使える API と書き方", () => {
  test.each([
    {
      label: "管理画面の components から feature の import",
      file: "apps/admin/src/components/uses-feature.tsx",
      rule: "eslint(no-restricted-imports)",
    },
    {
      label: "管理画面の components から feature の再 export",
      file: "apps/admin/src/components/reexports-feature.ts",
      rule: "eslint(no-restricted-imports)",
    },
    {
      label: "管理画面の本番のコードでの、Node の API のサブパスの import",
      file: "apps/admin/src/uses-node-subpath.ts",
      rule: "eslint(no-restricted-imports)",
    },
    {
      label: "管理画面の画面のコードでの React Aria Components の import",
      file: "apps/admin/src/routes/uses-aria.tsx",
      rule: "eslint(no-restricted-imports)",
    },
    {
      label:
        "管理画面の画面のコードでの React Aria Components のサブパスの import",
      file: "apps/admin/src/routes/uses-aria-subpath.tsx",
      rule: "eslint(no-restricted-imports)",
    },
    {
      label: "管理画面の画面のコードでの lucide-react の import",
      file: "apps/admin/src/routes/uses-lucide.tsx",
      rule: "eslint(no-restricted-imports)",
    },
    {
      label: "管理画面の画面のコードでの lucide-react のサブパスの import",
      file: "apps/admin/src/routes/uses-lucide-subpath.tsx",
      rule: "eslint(no-restricted-imports)",
    },
    {
      label: "管理画面の、tailwind-variants の merge の入口の import",
      file: "apps/admin/src/ui/primitives/uses-merge-entry.ts",
      rule: "eslint(no-restricted-imports)",
    },
    {
      label: "管理画面の ui/patterns/ からの features の import",
      file: "apps/admin/src/ui/patterns/uses-feature.ts",
      rule: "eslint(no-restricted-imports)",
    },
    {
      label: "管理画面の ui/primitives/ からの router の型の import",
      file: "apps/admin/src/ui/primitives/uses-router.ts",
      rule: "eslint(no-restricted-imports)",
    },
    {
      label: "管理画面の ui/layout/ からの API の型の import",
      file: "apps/admin/src/ui/layout/uses-api.ts",
      rule: "eslint(no-restricted-imports)",
    },
    {
      label: "管理画面の ui/patterns/ からの、相対パスでの features の import",
      file: "apps/admin/src/ui/patterns/uses-relative-feature.ts",
      rule: "eslint(no-restricted-imports)",
    },
    {
      label: "管理画面の ui/primitives/ からの oRPC のサブパスの import",
      file: "apps/admin/src/ui/primitives/uses-orpc-subpath.ts",
      rule: "eslint(no-restricted-imports)",
    },
    {
      label: "管理画面の ui/tv.ts からの API の型の import",
      file: "apps/admin/src/ui/tv.ts",
      rule: "eslint(no-restricted-imports)",
    },
    {
      label: "管理画面の ui/layout/ からの primitives の import",
      file: "apps/admin/src/ui/layout/uses-primitive.tsx",
      rule: "eslint(no-restricted-imports)",
    },
    {
      label: "管理画面の ui/primitives/ からの patterns の import",
      file: "apps/admin/src/ui/primitives/uses-pattern.tsx",
      rule: "eslint(no-restricted-imports)",
    },
    {
      label: "管理画面の ui/layout/ から `@/` で書いた primitives の import",
      file: "apps/admin/src/ui/layout/uses-aliased-primitive.tsx",
      rule: "eslint(no-restricted-imports)",
    },
    {
      label: "管理画面の ui/layout/ から `@/` で書いた patterns の import",
      file: "apps/admin/src/ui/layout/uses-aliased-pattern.tsx",
      rule: "eslint(no-restricted-imports)",
    },
    {
      label: "管理画面の ui/primitives/ から `@/` で書いた patterns の import",
      file: "apps/admin/src/ui/primitives/uses-aliased-pattern.tsx",
      rule: "eslint(no-restricted-imports)",
    },
    {
      label:
        "管理画面の ui/layout/ から primitives のフォルダを指定した import",
      file: "apps/admin/src/ui/layout/uses-primitive-entry.ts",
      rule: "eslint(no-restricted-imports)",
    },
    {
      label:
        "管理画面の ui/layout/ から patterns のフォルダを相対パスで指定した import",
      file: "apps/admin/src/ui/layout/uses-pattern-entry.ts",
      rule: "eslint(no-restricted-imports)",
    },
    {
      label:
        "管理画面の ui/layout/ から primitives の下のフォルダを指定した import",
      file: "apps/admin/src/ui/layout/uses-primitive-group-entry.ts",
      rule: "eslint(no-restricted-imports)",
    },
    {
      label:
        "管理画面の ui/primitives/ から patterns のフォルダを指定した import",
      file: "apps/admin/src/ui/primitives/uses-pattern-entry.ts",
      rule: "eslint(no-restricted-imports)",
    },
    {
      label:
        "管理画面の、merge の設定を入れていない tailwind-variants の import",
      file: "apps/admin/src/ui/primitives/uses-default-tv.ts",
      rule: "eslint(no-restricted-imports)",
    },
    {
      label: "contract での Node の API の import",
      file: "packages/contract/src/uses-node.ts",
      rule: "eslint(no-restricted-imports)",
    },
    {
      label: "client の CLI の外での Node の API の import",
      file: "packages/client/src/uses-node.ts",
      rule: "eslint(no-restricted-imports)",
    },
    {
      label: "client の CLI での Bun の API の import",
      file: "packages/client/src/cli/uses-bun.ts",
      rule: "eslint(no-restricted-imports)",
    },
    {
      label: "client の CLI での node:process の import",
      file: "packages/client/src/cli/imports-process.ts",
      rule: "eslint(no-restricted-imports)",
    },
    {
      label: "client の CLI の入口の外での process.env",
      file: "packages/client/src/cli/reads-env.ts",
      rule: "node(no-process-env)",
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

describe("feature の import", () => {
  test.each([
    { app: "admin", file: "dependencies.ts", lines: [1, 2, 4] },
    { app: "admin", file: "react-libraries.ts", lines: [1, 2, 3, 5, 6] },
    { app: "admin", file: "ui-libraries.ts", lines: [1, 2, 3, 4] },
    {
      app: "server",
      file: "external-imports.ts",
      lines: [1, 2, 3, 4, 5, 6, 7, 9],
    },
    {
      app: "server",
      file: "queries/external-imports.query.ts",
      lines: [1, 3, 4],
    },
    { app: "server", file: "misplaced.query.ts", lines: [1] },
    { app: "server", file: "queries/not-a-query.ts", lines: [1, 5] },
  ])(
    "$app の $file の外部 import に、import ごとに診断を1件ずつ出すこと",
    ({ app, file, lines }) => {
      const { diagnostics } = lintFixture(
        `invalid/apps/${app}/src/features/dependencies/${file}`,
      );

      const restrictedImports = diagnostics.filter(
        ({ code }) => code === "eslint(no-restricted-imports)",
      );

      expect(
        restrictedImports
          .map(({ line }) => line)
          .toSorted((left, right) => left - right),
      ).toEqual([...lines]);
    },
  );
  test("queries/ の外で Drizzle の型を書く import() に診断を出すこと", () => {
    const result = lintFixture(
      "invalid/apps/server/src/features/dependencies/misplaced.query.ts",
    );

    expect(ruleIdsOf(result)).toContain("typescript(consistent-type-imports)");
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
