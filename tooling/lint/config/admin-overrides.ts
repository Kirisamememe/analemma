import type { OxlintOverride } from "oxlint";

import {
  ADMIN_FEATURE_PATTERNS,
  UI_LIBRARY_PATTERNS,
  VARIANT_LIBRARY_PATTERNS,
  WORKSPACE_BUN_GLOBALS,
  WORKSPACE_RUNTIME_PATTERNS,
  restrictApis,
  type RestrictedApis,
} from "./restricted-apis.ts";

const ADMIN_EFFECT_HOOKS = ["useHtmlPreferences"];

/** ほかの層を import させないパスの形。 */
const layerPatterns = (layers: readonly string[], message: string) => [
  {
    group: layers.flatMap((layer) => [`**/${layer}`, `**/${layer}/**`]),
    message,
  },
];

const LAYOUT_LAYERS = layerPatterns(
  ["primitives", "patterns"],
  "ui/layout/ は primitives と patterns を import しません(並べ方と文字だけを持つ層)。",
);

const PRIMITIVE_LAYERS = layerPatterns(
  ["patterns"],
  "ui/primitives/ は patterns を import しません(patterns が primitives を組み合わせる)。",
);

const COMPONENT_LAYERS = layerPatterns(
  ["features"],
  "components/ は features を import しません(複数の feature から使う部品を置く場所)。",
);

const adminApis = ({ imports, globals }: RestrictedApis): RestrictedApis => ({
  imports: {
    ...imports,
    patterns: [...WORKSPACE_RUNTIME_PATTERNS, ...(imports.patterns ?? [])],
  },
  globals: [...WORKSPACE_BUN_GLOBALS, ...globals],
});

const inDirectory = (
  directory: string,
  apis: RestrictedApis,
): OxlintOverride => ({
  files: [
    `**/apps/admin/src/${directory}*.ts`,
    `**/apps/admin/src/${directory}*.tsx`,
  ],
  rules: restrictApis(adminApis(apis)),
});

/** 管理画面の境界を守る設定(後に書いたものが勝つ)。 */
export const ADMIN_OVERRIDES: readonly OxlintOverride[] = [
  { files: ["apps/admin/**"], env: { browser: true } },
  {
    files: ["**/apps/admin/**"],
    rules: {
      "project/no-effect-outside-allowed-hook": [
        "error",
        { allowedHooks: ADMIN_EFFECT_HOOKS },
      ],
    },
  },
  inDirectory("**/", {
    imports: {
      patterns: [...VARIANT_LIBRARY_PATTERNS, ...UI_LIBRARY_PATTERNS],
    },
    globals: [],
  }),
  inDirectory("components/**/", {
    imports: {
      patterns: [
        ...VARIANT_LIBRARY_PATTERNS,
        ...UI_LIBRARY_PATTERNS,
        ...COMPONENT_LAYERS,
      ],
    },
    globals: [],
  }),
  inDirectory("ui/primitives/**/", {
    imports: {
      patterns: [...VARIANT_LIBRARY_PATTERNS, ...PRIMITIVE_LAYERS],
    },
    globals: [],
  }),
  inDirectory("ui/layout/**/", {
    imports: {
      patterns: [
        ...VARIANT_LIBRARY_PATTERNS,
        ...UI_LIBRARY_PATTERNS,
        ...LAYOUT_LAYERS,
      ],
    },
    globals: [],
  }),
  {
    files: ["**/apps/admin/src/ui/tv.ts"],
    rules: restrictApis(
      adminApis({
        imports: { patterns: UI_LIBRARY_PATTERNS },
        globals: [],
      }),
    ),
  },
  {
    files: ["**/apps/admin/src/{features,components,ui}/**/*.{ts,tsx}"],
    excludeFiles: ["**/__tests__/**", "**/__stories__/**"],
    rules: {
      "project/admin-module-location": [
        "error",
        {
          effectfulModules: [
            "features/auth/create-auth-gate.ts",
            "features/auth/webauthn/create-authenticator.ts",
            "features/auth/webauthn/create-browser-web-authn.ts",
            "features/deploy-tokens/issue/copy-text.ts",
            "features/fixed-pages/content-form.ts",
            "features/fixed-pages/editor/create-editor-values.ts",
            "ui/primitives/form-fields/focus-first-invalid-field.ts",
          ],
        },
      ],
    },
  },
  {
    files: ["**/apps/admin/src/**/*.ts"],
    rules: {
      "project/no-react-in-logic": "error",
      "project/require-sibling-test": "error",
    },
  },
  {
    files: ["**/apps/admin/src/**/*.tsx"],
    rules: {
      "project/require-sibling-test": ["error", { branchingComponents: true }],
    },
  },
  {
    files: [
      "**/apps/admin/src/features/**/*.ts",
      "**/apps/admin/src/features/**/*.tsx",
    ],
    rules: restrictApis({
      imports: { patterns: ADMIN_FEATURE_PATTERNS },
      globals: WORKSPACE_BUN_GLOBALS,
    }),
  },
  inDirectory("**/__stories__/", {
    imports: {
      patterns: [...VARIANT_LIBRARY_PATTERNS, ...UI_LIBRARY_PATTERNS],
    },
    globals: [],
  }),
  {
    files: ["**/apps/admin/src/**/__stories__/**"],
    rules: { "project/require-sibling-test": "off" },
  },
  {
    files: [
      "**/apps/admin/src/**/__tests__/*.ts",
      "**/apps/admin/src/**/__tests__/*.tsx",
    ],
    rules: restrictApis({
      imports: {
        patterns: [...VARIANT_LIBRARY_PATTERNS, ...UI_LIBRARY_PATTERNS],
      },
      globals: [],
    }),
  },
];
