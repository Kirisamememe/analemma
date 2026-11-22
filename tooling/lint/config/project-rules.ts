import type { DummyRuleMap } from "oxlint";

/** 長いファイルとして扱い始める、コードの行数。 */
export const LONG_FILE_CODE_LINES = 200;

/** 自作のルールと、JS のプラグインのルール。 */
export const PROJECT_RULES = {
  "jsdoc-js/require-description": "error",
  "jsdoc-type/require-description": "error",
  "jsdoc-type/require-jsdoc": [
    "error",
    {
      contexts: [
        "TSPropertySignature",
        "TSMethodSignature",
        "TSIndexSignature",
      ],
      enableFixer: false,
      publicOnly: false,
      require: {
        ArrowFunctionExpression: false,
        ClassDeclaration: false,
        FunctionDeclaration: false,
        FunctionExpression: false,
        MethodDefinition: false,
      },
    },
  ],
  "jsdoc-js/require-jsdoc": [
    "error",
    {
      contexts: [
        "TSTypeAliasDeclaration",
        "TSInterfaceDeclaration",
        "TSEnumDeclaration",
      ],
      enableFixer: false,
      publicOnly: true,
      require: {
        ArrowFunctionExpression: true,
        FunctionDeclaration: true,
        FunctionExpression: true,
      },
    },
  ],
  "prefer-arrow-functions/prefer-arrow-functions": [
    "error",
    {
      allowObjectProperties: true,
    },
  ],
  "stylistic/lines-between-class-members": ["error", "always"],
  "stylistic/padding-line-between-statements": [
    "error",
    {
      blankLine: "always",
      prev: "*",
      next: "return",
    },
    {
      blankLine: "any",
      prev: ["singleline-const", "singleline-let", "singleline-expression"],
      next: {
        selector: "ReturnStatement:nth-child(2):last-child",
      },
    },
    {
      blankLine: "always",
      prev: "*",
      next: ["if", "for", "while", "do", "switch", "try"],
    },
    {
      blankLine: "always",
      prev: ["if", "for", "while", "do", "switch", "try", "block-like"],
      next: "*",
    },
    {
      blankLine: "any",
      prev: "*",
      next: ["case", "default"],
    },
  ],
  "project/no-markup-test": "error",
  "project/no-standalone-comment": [
    "error",
    {
      maxTrailingLength: 40,
      dividerAllowedAfter: LONG_FILE_CODE_LINES,
      dividerRequiredAfter: 400,
    },
  ],
  "project/tsdoc-role-only": [
    "error",
    {
      maxLength: 60,
    },
  ],
  "project/no-focused-test": "error",
  "jsdoc-js/check-param-names": [
    "error",
    {
      checkDestructured: false,
    },
  ],
  "jsdoc-js/require-param": [
    "error",
    {
      ignoreWhenAllParamsMissing: true,
      checkDestructured: false,
      checkDestructuredRoots: false,
    },
  ],
  "jsdoc-js/require-param-name": "error",
  "jsdoc-js/require-param-description": "error",
  "jsdoc-js/require-returns-check": "error",
  "jsdoc-js/require-returns-description": "error",
  "jsdoc-js/no-types": "error",
  "jsdoc-js/check-tag-names": [
    "error",
    {
      typed: true,
    },
  ],
  "project/no-cross-workspace-import": "error",
  "project/no-dynamic-import": "error",
  "project/test-location": "error",
  "project/file-length-limit": [
    "error",
    {
      max: 800,
    },
  ],
  "project/require-disable-reason": [
    "error",
    {
      unsuppressible: [
        "project/file-length-limit",
        "project/no-standalone-comment",
        "project/require-disable-reason",
      ],
      topOfFileOnly: ["project/max-code-lines"],
    },
  ],
  "project/max-code-lines": [
    "error",
    {
      max: 400,
    },
  ],
} satisfies DummyRuleMap;
