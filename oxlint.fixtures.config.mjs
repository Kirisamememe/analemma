import { readFileSync } from "node:fs";
import { join } from "node:path";

/* oxlint-disable typescript/no-unsafe-assignment, typescript/no-unsafe-call, typescript/no-unsafe-member-access -- JSON.parse の結果には型が付かない。読み込んだ値は Oxlint が検証する。 */
const rootConfig = JSON.parse(
  readFileSync(join(import.meta.dirname, ".oxlintrc.json"), "utf8"),
);

const config = {
  ...rootConfig,
  ignorePatterns: rootConfig.ignorePatterns.filter(
    (pattern) => pattern !== "tooling/lint/fixtures/**",
  ),
  options: {
    denyWarnings: true,
    reportUnusedDisableDirectives: "error",
    typeAware: false,
  },
};

export default config;
