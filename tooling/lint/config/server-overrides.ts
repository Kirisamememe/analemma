import type { OxlintOverride } from "oxlint";

import {
  BUILDER_PATHS,
  DATABASE_PATHS,
  DATABASE_PATTERNS,
  SERVER_BUN_GLOBALS,
  SERVER_BUN_PATTERNS,
  restrictApis,
} from "./restricted-apis.ts";

const UNRESTRICTED_GLOBALS = {
  "eslint/no-restricted-globals": "off",
  "eslint/no-restricted-properties": "off",
} as const;

/** server の境界を守る設定(後に書いたものが勝つ)。 */
export const SERVER_OVERRIDES: readonly OxlintOverride[] = [
  {
    files: ["**/apps/server/src/**"],
    rules: {
      ...restrictApis({
        imports: {
          paths: [...DATABASE_PATHS, ...BUILDER_PATHS],
          patterns: [...DATABASE_PATTERNS, ...SERVER_BUN_PATTERNS],
        },
        globals: SERVER_BUN_GLOBALS,
      }),
      "project/no-catch-outside-entry": "error",
    },
  },
  {
    files: ["**/apps/server/src/**/*.query.ts", "**/apps/server/src/db/**"],
    rules: restrictApis({
      imports: { paths: BUILDER_PATHS, patterns: SERVER_BUN_PATTERNS },
      globals: SERVER_BUN_GLOBALS,
    }),
  },
  {
    files: ["**/apps/server/src/platform/**"],
    rules: {
      "eslint/no-restricted-imports": ["error", { paths: BUILDER_PATHS }],
      ...UNRESTRICTED_GLOBALS,
    },
  },
  {
    files: ["**/apps/server/src/main.ts"],
    rules: {
      "eslint/no-restricted-imports": [
        "error",
        {
          paths: [...DATABASE_PATHS, ...BUILDER_PATHS],
          patterns: DATABASE_PATTERNS,
        },
      ],
      ...UNRESTRICTED_GLOBALS,
    },
  },
  {
    files: ["**/apps/server/src/procedures.ts", "**/apps/server/src/router.ts"],
    rules: restrictApis({
      imports: {
        paths: DATABASE_PATHS,
        patterns: [...DATABASE_PATTERNS, ...SERVER_BUN_PATTERNS],
      },
      globals: SERVER_BUN_GLOBALS,
    }),
  },
  {
    files: [
      "**/apps/server/src/main.ts",
      "**/apps/server/src/enroll.ts",
      "**/apps/server/src/app.ts",
      "**/apps/server/src/db/migrate.ts",
      "**/apps/server/src/platform/parse-database-url.ts",
      "**/apps/server/src/platform/test-database/**",
      "**/apps/server/src/test-client/**",
      "**/*.test.ts",
    ],
    rules: { "project/no-catch-outside-entry": "off" },
  },
];
