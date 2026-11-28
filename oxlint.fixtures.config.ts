import { defineConfig } from "oxlint";

import config from "./oxlint.config.ts";

export default defineConfig({
  ...config,
  ignorePatterns: config.ignorePatterns.filter(
    (pattern) => pattern !== "tooling/lint/fixtures/**",
  ),
  overrides: [
    ...config.overrides,
    {
      files: [
        "**/tooling/lint/fixtures/invalid/files/801-lines-with-exception.ts",
        "**/tooling/lint/fixtures/invalid/comments/missing-divider.ts",
        "**/tooling/lint/fixtures/invalid/comments/divider-at-end.ts",
        "**/tooling/lint/fixtures/invalid/comments/comment-after-divider.ts",
        "**/tooling/lint/fixtures/invalid/comments/directive-as-title.ts",
      ],
      rules: { "project/max-code-lines": "off" },
    },
  ],
  options: {
    denyWarnings: true,
    reportUnusedDisableDirectives: "error",
    typeAware: false,
  },
});
