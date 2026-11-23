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

  test("本番のコードからの、テスト用の認証器と W3C の例の import を見つけること", () => {
    expect(
      findTestOnlyImports({
        path: "apps/server/src/features/auth/login/verify-login.ts",
        text: [
          'import { createFakeAuthenticator } from "../webauthn/fake-authenticator/create-fake-authenticator";',
          'import { W3C_TEST_VECTORS } from "../webauthn/w3c-test-vectors";',
        ].join("\n"),
      }),
    ).toEqual([
      "apps/server/src/features/auth/webauthn/fake-authenticator/create-fake-authenticator",
      "apps/server/src/features/auth/webauthn/w3c-test-vectors",
    ]);
  });

  test("拡張子を付けた import も見つけること", () => {
    expect(
      findTestOnlyImports({
        path: "apps/server/src/features/auth/login/verify-login.ts",
        text: [
          'import { W3C_TEST_VECTORS } from "../webauthn/w3c-test-vectors.js";',
          'import { createFakeAuthenticator } from "../webauthn/fake-authenticator/create-fake-authenticator.ts";',
        ].join("\n"),
      }),
    ).toEqual([
      "apps/server/src/features/auth/webauthn/w3c-test-vectors",
      "apps/server/src/features/auth/webauthn/fake-authenticator/create-fake-authenticator",
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

  test("管理画面の story は、テストの部品を import できること", () => {
    const text = 'import { AppPreview } from "../../testing/app-preview";';

    expect(
      findTestOnlyImports({
        path: "apps/admin/src/routes/__stories__/login-page.stories.tsx",
        text,
      }),
    ).toEqual([]);
    expect(
      findTestOnlyImports({
        path: "apps/admin/src/routes/login/page.tsx",
        text,
      }),
    ).toEqual(["apps/admin/src/testing/app-preview"]);
  });

  const aliasedText = [
    'import { AppPreview } from "@/testing/app-preview";',
    'export { ColorSpecimen } from "@/ui/specimens/color-specimen.tsx";',
    'import * as stories from "@/ui/__stories__/colors.stories";',
    'import { Button } from "@/ui/primitives/button";',
  ].join("\n");

  test("管理画面の本番のコードからの、`@/` での import と re-export を見つけること", () => {
    expect(
      findTestOnlyImports({
        path: "apps/admin/src/routes/page.tsx",
        text: aliasedText,
      }),
    ).toEqual([
      "apps/admin/src/testing/app-preview",
      "apps/admin/src/ui/__stories__/colors.stories",
      "apps/admin/src/ui/specimens/color-specimen",
    ]);
  });

  test("server の本番のコードからの、`@/` でのテスト専用の import と re-export を見つけること", () => {
    expect(
      findTestOnlyImports({
        path: "apps/server/src/app.ts",
        text: [
          'import { createTestClient } from "@/test-client";',
          'export { createTestDatabase } from "@/platform/test-database/create-test-database";',
          'import { router } from "@/router";',
        ].join("\n"),
      }),
    ).toEqual([
      "apps/server/src/test-client",
      "apps/server/src/platform/test-database/create-test-database",
    ]);
  });

  test("テストの側からの、`@/` での import を数えないこと", () => {
    for (const path of [
      "apps/admin/src/routes/__tests__/page.test.tsx",
      "apps/admin/src/routes/__stories__/page.stories.tsx",
      "apps/admin/.storybook/preview.tsx",
      "apps/server/src/__tests__/app.test.ts",
    ]) {
      expect(findTestOnlyImports({ path, text: aliasedText })).toEqual([]);
    }
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
