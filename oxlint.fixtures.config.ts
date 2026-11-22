import { defineConfig } from "oxlint";

import config from "./oxlint.config.ts";

export default defineConfig({
  ...config,
  ignorePatterns: config.ignorePatterns.filter(
    (pattern) => pattern !== "tooling/lint/fixtures/**",
  ),
  options: {
    denyWarnings: true,
    reportUnusedDisableDirectives: "error",
    typeAware: false,
  },
});
