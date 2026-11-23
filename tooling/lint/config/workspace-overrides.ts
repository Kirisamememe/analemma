import type { OxlintOverride } from "oxlint";

import { LONG_FILE_CODE_LINES } from "./project-rules.ts";
import {
  WORKSPACE_BUN_GLOBALS,
  WORKSPACE_RUNTIME_PATTERNS,
  restrictApis,
} from "./restricted-apis.ts";

const NODE_EXTENSIONS = {
  css: "always",
  json: "always",
  mjs: "always",
  svg: "always",
} as const;

/** 実行環境・テスト・ワークスペースごとの設定(後に書いたものが勝つ)。 */
export const WORKSPACE_OVERRIDES: readonly OxlintOverride[] = [
  {
    files: ["apps/server/**", "tooling/**", "*.mjs"],
    env: { node: true },
    globals: { Bun: "readonly" },
  },
  {
    files: ["apps/**", "packages/**", "tooling/**"],
    rules: {
      "project/max-exported-functions": [
        "error",
        { max: 2, limitedAfter: LONG_FILE_CODE_LINES },
      ],
      "project/no-inline-parameter-type": "error",
    },
  },
  {
    files: ["tooling/lint/**/*.mjs"],
    rules: {
      "typescript/no-unsafe-argument": "off",
      "typescript/no-unsafe-assignment": "off",
      "typescript/no-unsafe-call": "off",
      "typescript/no-unsafe-member-access": "off",
      "typescript/no-unsafe-return": "off",
      "typescript/strict-boolean-expressions": "off",
      "import/extensions": [
        "error",
        "never",
        {
          checkTypeImports: true,
          ignorePackages: true,
          pattern: NODE_EXTENSIONS,
        },
      ],
    },
  },
  {
    files: [
      "oxlint.config.ts",
      "oxlint.fixtures.config.ts",
      "**/tooling/lint/config/**/*.ts",
      "**/apps/admin/.storybook/*.ts",
    ],
    rules: {
      "import/extensions": [
        "error",
        "never",
        {
          checkTypeImports: true,
          ignorePackages: true,
          pattern: { ...NODE_EXTENSIONS, ts: "always" },
        },
      ],
    },
  },
  {
    files: ["**/apps/admin/.storybook/use-html-preferences.ts"],
    rules: { "typescript/dot-notation": "off" },
  },
  {
    files: ["**/*.test.ts", "**/*.test.tsx"],
    rules: {
      "eslint/no-await-in-loop": "off",
      "typescript/consistent-type-assertions": [
        "error",
        { assertionStyle: "as", objectLiteralTypeAssertions: "allow" },
      ],
      "typescript/no-non-null-assertion": "off",
      "unicorn/prefer-type-error": "off",
    },
  },
  {
    files: ["**/packages/*/src/**"],
    rules: restrictApis({
      imports: { patterns: WORKSPACE_RUNTIME_PATTERNS },
      globals: WORKSPACE_BUN_GLOBALS,
    }),
  },
  {
    files: ["**/packages/client/src/cli/**"],
    env: { node: true },
    rules: {
      "eslint/no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "node:process",
              message:
                "CLI では、グローバルの process を使います。process.env は main.ts でだけ読みます(import した process の env には、node/no-process-env が診断を出しません)。",
            },
          ],
          patterns: [
            {
              group: ["bun", "bun:*", "!bun:test", "hono/bun"],
              message:
                "Bun 専用の API は server の src/platform/ と src/main.ts だけで使います。CLI は Node で動かします。",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["**/packages/client/src/cli/main.ts"],
    rules: { "node/no-process-env": "off" },
  },
];
