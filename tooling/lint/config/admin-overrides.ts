import type { OxlintOverride } from "oxlint";

import {
  REACT_PATHS,
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

const adminApis = (
  logic: boolean,
  { imports, globals }: RestrictedApis,
): RestrictedApis => ({
  imports: {
    paths: [...(logic ? REACT_PATHS : []), ...(imports.paths ?? [])],
    patterns: [...WORKSPACE_RUNTIME_PATTERNS, ...(imports.patterns ?? [])],
  },
  globals: [...WORKSPACE_BUN_GLOBALS, ...globals],
});

const byExtension = (
  directory: string,
  apis: RestrictedApis,
): OxlintOverride[] => [
  {
    files: [`**/apps/admin/src/${directory}*.ts`],
    rules: restrictApis(adminApis(true, apis)),
  },
  {
    files: [`**/apps/admin/src/${directory}*.tsx`],
    rules: restrictApis(adminApis(false, apis)),
  },
];

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
  ...byExtension("**/", {
    imports: {
      patterns: [...VARIANT_LIBRARY_PATTERNS, ...UI_LIBRARY_PATTERNS],
    },
    globals: [],
  }),
  ...byExtension("ui/primitives/**/", {
    imports: {
      patterns: [...VARIANT_LIBRARY_PATTERNS, ...PRIMITIVE_LAYERS],
    },
    globals: [],
  }),
  ...byExtension("ui/layout/**/", {
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
      adminApis(true, {
        imports: { patterns: UI_LIBRARY_PATTERNS },
        globals: [],
      }),
    ),
  },
  {
    files: ["**/apps/admin/src/**/*.ts"],
    rules: { "project/require-sibling-test": "error" },
  },
  {
    files: ["**/apps/admin/src/**/*.tsx"],
    rules: {
      "project/require-sibling-test": ["error", { branchingComponents: true }],
    },
  },
  ...byExtension("**/__stories__/", {
    imports: {
      patterns: [...VARIANT_LIBRARY_PATTERNS, ...UI_LIBRARY_PATTERNS],
    },
    globals: [],
  }),
  {
    files: ["**/apps/admin/src/**/__stories__/**"],
    rules: { "project/require-sibling-test": "off" },
  },
  ...(["ts", "tsx"] as const).map((extension) => ({
    files: [`**/apps/admin/src/**/__tests__/*.${extension}`],
    rules: restrictApis({
      imports: {
        paths: extension === "ts" ? REACT_PATHS : [],
        patterns: [...VARIANT_LIBRARY_PATTERNS, ...UI_LIBRARY_PATTERNS],
      },
      globals: [],
    }),
  })),
];
