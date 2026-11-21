import { defineConfig } from "oxlint";

import {
  ADMIN_CLASS_OVERRIDES,
  ADMIN_CLASS_SETTINGS,
} from "./tooling/lint/config/admin-classes.ts";
import { CORE_RULES } from "./tooling/lint/config/core-rules.ts";
import { PROJECT_RULES } from "./tooling/lint/config/project-rules.ts";
import { SERVER_OVERRIDES } from "./tooling/lint/config/server-overrides.ts";
import { WORKSPACE_OVERRIDES } from "./tooling/lint/config/workspace-overrides.ts";

export default defineConfig({
  categories: {
    correctness: "error",
    pedantic: "error",
    perf: "error",
    suspicious: "error",
  },
  env: { builtin: true },
  ignorePatterns: [
    "node_modules/**",
    "apps/*/dist/**",
    "packages/*/dist/**",
    "tooling/lint/fixtures/**",
    "bun.lock",
  ],
  jsPlugins: [
    {
      name: "prefer-arrow-functions",
      specifier: "eslint-plugin-prefer-arrow-functions",
    },
    { name: "jsdoc-js", specifier: "eslint-plugin-jsdoc" },
    { name: "jsdoc-type", specifier: "./tooling/lint/jsdoc-type-plugin.mjs" },
    { name: "project", specifier: "./tooling/lint/plugin.mjs" },
    { name: "stylistic", specifier: "@stylistic/eslint-plugin" },
  ],
  options: {
    denyWarnings: true,
    reportUnusedDisableDirectives: "error",
    typeAware: true,
  },
  plugins: [
    "eslint",
    "typescript",
    "oxc",
    "import",
    "unicorn",
    "promise",
    "node",
    "react",
    "jsx-a11y",
  ],
  settings: { "better-tailwindcss": ADMIN_CLASS_SETTINGS },
  rules: { ...CORE_RULES, ...PROJECT_RULES },
  overrides: [
    ...WORKSPACE_OVERRIDES,
    ...SERVER_OVERRIDES,
    ...ADMIN_CLASS_OVERRIDES,
  ],
});
