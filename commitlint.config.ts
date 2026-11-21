import { RuleConfigSeverity, type UserConfig } from "@commitlint/types";

import { commitlintRules } from "./tooling/git-hooks/commit-rules";

const TYPES = [
  "feat",
  "fix",
  "refactor",
  "perf",
  "test",
  "docs",
  "build",
  "ci",
  "chore",
  "revert",
];

const SCOPES = ["server", "admin", "contract", "client", "tooling", "deps"];

const config: UserConfig = {
  extends: ["@commitlint/config-conventional"],
  plugins: [commitlintRules],
  rules: {
    "type-enum": [RuleConfigSeverity.Error, "always", TYPES],
    "scope-enum": [RuleConfigSeverity.Error, "always", SCOPES],
    "subject-case": [RuleConfigSeverity.Disabled],
    "subject-full-stop": [RuleConfigSeverity.Error, "never", "。"],
    "subject-japanese": [RuleConfigSeverity.Error, "always"],
    "header-max-length": [RuleConfigSeverity.Disabled],
    "header-max-width": [RuleConfigSeverity.Error, "always"],
    "body-leading-blank": [RuleConfigSeverity.Error, "always"],
    "body-max-line-length": [RuleConfigSeverity.Disabled],
    "footer-leading-blank": [RuleConfigSeverity.Error, "always"],
    "footer-max-line-length": [RuleConfigSeverity.Disabled],
  },
};

export default config;
