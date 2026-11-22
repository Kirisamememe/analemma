import { describe, expect, test } from "bun:test";

import { findTestOnlyImports } from "../test-only-imports";

const IMPORTS = [
  'import { catchErrorCode } from "./test-client/catch-error-code";',
  'export { createTestDatabase } from "./platform/test-database/create-test-database";',
].join("\n");

describe("テストだけのフォルダからの import", () => {
  test("本番のコードからの import と re-export を見つけること", () => {
    expect(
      findTestOnlyImports({ path: "apps/server/src/app.ts", text: IMPORTS }),
    ).toEqual([
      "apps/server/src/test-client/catch-error-code",
      "apps/server/src/platform/test-database/create-test-database",
    ]);
  });

  test("テストのファイルと、テストの部品の中からの import は許すこと", () => {
    for (const path of [
      "apps/server/src/__tests__/app.test.ts",
      "apps/server/src/test-client/create-test-client.ts",
      "apps/server/src/platform/test-database/prepare.ts",
    ]) {
      expect(findTestOnlyImports({ path, text: IMPORTS })).toEqual([]);
    }
  });

  test("本番のコードは、色と文字の見本と story を import できないこと", () => {
    const text = [
      'import { ColorSpecimen } from "../ui/specimens/color-specimen";',
      'import * as stories from "../ui/__stories__/button.stories";',
    ].join("\n");

    expect(
      findTestOnlyImports({ path: "apps/admin/src/routes/page.tsx", text }),
    ).toEqual([
      "apps/admin/src/ui/specimens/color-specimen",
      "apps/admin/src/ui/__stories__/button.stories",
    ]);
    expect(
      findTestOnlyImports({ path: "apps/admin/.storybook/preview.tsx", text }),
    ).toEqual([]);
  });

  test("名前が似ているだけのフォルダと、パッケージ名での import は数えないこと", () => {
    expect(
      findTestOnlyImports({
        path: "apps/server/src/features/posts/get-post.ts",
        text: [
          'import { a } from "../../test-client-helpers/a";',
          'import { b } from "test-client";',
        ].join("\n"),
      }),
    ).toEqual([]);
  });
});
