import { getDefaultSelectors } from "eslint-plugin-better-tailwindcss/api/defaults";
import type { AllowWarnDeny, OxlintOverride } from "oxlint";

import { BORDER_CLASSES, borderRestriction } from "./admin-borders.ts";

/** `no-restricted-classes` で止める class の形。 */
type Restriction = {
  /** class に当てる正規表現。 */
  readonly pattern: string;
  /** 診断の文言。 */
  readonly message: string;
};

/** `no-restricted-classes` の options。 */
type RestrictOptions = {
  /** 止める class の形。 */
  readonly restrict: readonly Restriction[];
};

const VARIANTS = "^(?:[^:]+:)*";
const SCALE = "xs|sm|base|lg|xl|2xl|3xl|4xl|5xl";
const SPACING = ["0", "0\\.5", "1", "1\\.5", "2", "3", "4", "6", "8", "12"];
const OPACITY = ["5", "10", "15", "20", "30", "40", "60", "80"];
const SIDES = "(?:[xytrblse]|bs|be)?";
const SPACING_UTILITIES = `gap-[xy]|gap(?!-[xy]-)|p${SIDES}|m${SIDES}|scroll-p${SIDES}|scroll-m${SIDES}`; // gap-x-3 の x-3 を値と読まない
const BORDER = "border(?:-[xytrblse]|-bs|-be)?";
const MODIFIER = "(?:/[^/]+)?";

/** 管理画面の文字の役割で使う、文字の大きさと行間の組。 */
export const TEXT_PAIRS = [
  "xs/lg",
  "sm/xl",
  "sm/2xl",
  "base/2xl",
  "lg/2xl",
  "xl/3xl",
  "2xl/3xl",
  "3xl/5xl",
] as const;

/** theme.css の色ごとに、使ってよい utility(`border` は辺ごとの border も含む)。 */
export const COLOR_USAGE: Readonly<Record<string, readonly string[]>> = {
  canvas: ["bg"],
  surface: ["bg"],
  "surface-sunken": ["bg"],
  "surface-muted": ["bg"],
  fg: ["text", "fill", "stroke", "bg", "outline"],
  "fg-muted": ["text", "fill", "stroke"],
  line: ["border", "divide", "outline"],
  "line-strong": ["border"],
  focus: [],
  primary: ["bg", "text", "border", "fill", "stroke"],
  "on-primary": ["text", "fill", "stroke"],
  "danger-strong": ["bg"],
  "on-danger-strong": ["text", "fill", "stroke"],
  info: ["bg", "text", "border", "fill", "stroke"],
  success: ["bg", "text", "border", "fill", "stroke"],
  warning: ["bg", "text", "border", "fill", "stroke"],
  danger: ["bg", "text", "border", "outline", "fill", "stroke"],
  "on-info": ["text", "fill", "stroke"],
  "on-success": ["text", "fill", "stroke"],
  "on-warning": ["text", "fill", "stroke"],
  "on-danger": ["text", "fill", "stroke"],
  scrim: ["bg"],
  "on-media": ["text", "fill", "stroke"],
};

/** 不透明度を付けない、面の色。 */
const OPAQUE_COLORS = ["canvas", "surface", "surface-sunken", "surface-muted"];

/** 部品が読んでよい、実行時に決まる CSS 変数。 */
export const READABLE_VARIABLES = [
  "--trigger-width",
  "--visual-viewport-height",
  "--progress",
  "--media-aspect",
  "--media-color",
  "--focal-x",
  "--focal-y",
  "--scroll-thumb-size",
  "--scroll-thumb-position",
  "--scroll-view-limit",
] as const;

/** 画面のコード(ui/ の外)が書いてよい class。 */
export const SCREEN_CLASSES = [
  "grow",
  "shrink-0",
  "min-w-0",
  "truncate",
  "sr-only",
] as const;

const COLORS = Object.keys(COLOR_USAGE).toSorted(
  (left, right) => right.length - left.length,
);

const colorRestriction = (color: string): Restriction => {
  const allowed = COLOR_USAGE[color] ?? [];

  const utilities = allowed.map((utility) =>
    utility === "border" ? BORDER : utility,
  );

  const usage = utilities.length === 0 ? "(?!)" : `(?:${utilities.join("|")})`;
  const longer = COLORS.filter((other) => other.endsWith(`-${color}`));

  const notLonger =
    longer.length === 0 ? "" : `(?!.*-(?:${longer.join("|")})${MODIFIER}$)`;

  return {
    pattern: `${VARIANTS}(?!${usage}-${color}${MODIFIER}$)(?!rounded(?:-[a-z]{1,2})?-)(?!whitespace-)${notLonger}[a-z\\-]+-${color}${MODIFIER}$`,
    message:
      allowed.length === 0
        ? `${color} は class にせず、theme.css の utility の中でだけ使います。`
        : `${color} は ${allowed.join("・")} の色にだけ使います。`,
  };
};

const UI_RESTRICTIONS: readonly Restriction[] = [
  {
    pattern: "\\[",
    message:
      "任意の値・任意のプロパティ・任意の variant([…])は使いません。theme.css の役割か、部品の props を使います。",
  },
  {
    pattern: `\\((?!(?:[a-z\\-]+:)?(?:${READABLE_VARIABLES.join("|")})\\))`,
    message: `CSS 変数を直接読めるのは ${READABLE_VARIABLES.join("・")} だけです。`,
  },
  {
    pattern: "(?:^|:|-)dark:",
    message:
      "dark: は使いません。light と dark は theme.css の light-dark() で決めます。",
  },
  { pattern: "(?:^|:)!|!$", message: "!(!important)は使いません。" },
  {
    pattern: "(?:^|:|-)(?:data|aria)-",
    message: "状態は theme.css の is-*: の variant で書きます。",
  },
  {
    pattern: `${VARIANTS}-?z-\\d+$`,
    message: "重ね順は z-sticky・z-overlay・z-toast を使います。",
  },
  {
    pattern: `${VARIANTS}outline-none$`,
    message:
      "outline-none の代わりに outline-hidden を使います(forced-colors で線が残る)。",
  },
  {
    pattern: `${VARIANTS}(?!(?:[pm]|scroll-p)[xy]-panel$)-?(?:${SPACING_UTILITIES})-(?!(?:${SPACING.join("|")}|auto)$)`,
    message: `余白は ${SPACING.join("・").replaceAll("\\", "")} の目盛りを使います。パネルの両端には、padding・margin・scroll-padding の x・y に panel も使えます。`,
  },
  {
    pattern: `${VARIANTS}(?!my-panel$)(?:m|my|mt|mb|mbs|mbe)-(?!(?:0|auto)$)`,
    message: "上下の正の margin は使わず、親の gap で空けます。",
  },
  {
    pattern: `${VARIANTS}-?space-[xy]-`,
    message: "space-x/y は使わず、親の gap で空けます。",
  },
  {
    pattern: `${VARIANTS}leading-`,
    message: "行間は、文字の大きさと組で書きます(text-sm/xl)。",
  },
  {
    pattern: `${VARIANTS}text-(?:${SCALE})$`,
    message: "文字の大きさは、行間と組で書きます(text-sm/xl)。",
  },
  {
    pattern: `${VARIANTS}text-\\((?!color:)[a-z\\-]+:`,
    message:
      "文字の大きさは、theme.css の目盛りで書きます(型を付けた CSS 変数では書きません)。",
  },
  {
    pattern: `${VARIANTS}font-\\d+$`,
    message: "文字の太さは、font-normal・font-semibold・font-bold で書きます。",
  },
  {
    pattern: `${VARIANTS}(?:(?:duration|delay)-\\d+|ease-(?:linear|in|out|in-out)|(?:inset-)?ring(?:-\\d+)?|opacity-(?!(?:0|100)$).+|bg-(?:linear|radial|conic).*|(?:from|via|to)-.*)$`,
    message: "theme.css に無い値です(Tailwind CSS の既定から残っているもの)。",
  },
  {
    pattern: `${VARIANTS}[a-z\\-]+-(?:${OPAQUE_COLORS.join("|")})/`,
    message:
      "面の色(canvas・surface・surface-sunken・surface-muted)には不透明度を付けません。",
  },
  {
    pattern: `${VARIANTS}(?!text-(?:${SCALE})/)[a-z\\-]+-(?:${COLORS.join("|")}|current|transparent|inherit|\\([^)]*\\))/(?!(?:${OPACITY.join("|")})$)[^/]+$`,
    message: `色の不透明度は ${OPACITY.join("・")} だけです。`,
  },
];

const COLOR_USAGE_RESTRICTIONS = COLORS.map((color) => colorRestriction(color));

const TYPOGRAPHY_OUTSIDE_ROLES: Restriction = {
  pattern: `${VARIANTS}(?:text-(?:${SCALE})/|font-(?:normal|semibold|bold)$)`,
  message:
    "文字の大きさと太さは ui/typography.ts の役割だけで決めます。Text・Heading などの部品を使います。",
};

const LINE_STRONG_OUTSIDE_PRIMITIVES: Restriction = {
  pattern: `${VARIANTS}[a-z\\-]+-line-strong${MODIFIER}$`,
  message:
    "line-strong は、ui/primitives/ の、入力を受ける部品の枠にだけ使います。",
};

const UNLISTED_TEXT_PAIR: Restriction = {
  pattern: `${VARIANTS}text-(?!(?:${TEXT_PAIRS.join("|")})$)(?:${SCALE})/`,
  message: `文字の大きさと行間の組は ${TEXT_PAIRS.join("・")} だけです。`,
};

const SCREEN_RESTRICTION: Restriction = {
  pattern: `^(?!(?:${SCREEN_CLASSES.join("|")})$)`,
  message: `画面のコードは、並べ方・文字・色の class を書かず、ui/ の部品と props を使います(書けるのは ${SCREEN_CLASSES.join("・")} だけ)。`,
};

const restrictClasses = (
  restrict: readonly Restriction[],
): [AllowWarnDeny, RestrictOptions] => ["error", { restrict }];

const uiClassRestrictions = (file: string): readonly Restriction[] => [
  ...UI_RESTRICTIONS,
  ...(file === "ui/specimens/color-specimen.tsx"
    ? []
    : COLOR_USAGE_RESTRICTIONS),
  TYPOGRAPHY_OUTSIDE_ROLES,
  ...(file.startsWith("ui/primitives/") ||
  file === "ui/specimens/color-specimen.tsx"
    ? []
    : [LINE_STRONG_OUTSIDE_PRIMITIVES]),
  borderRestriction(BORDER_CLASSES[file]),
];

const ADMIN_SOURCES = ["ts", "tsx", "mts", "cts", "js", "jsx", "mjs", "cjs"];

/** 管理画面の、Tailwind CSS の class の検査(後に書いたものが勝つ)。 */
export const ADMIN_CLASS_OVERRIDES: readonly OxlintOverride[] = [
  {
    files: ADMIN_SOURCES.map(
      (extension) => `**/apps/admin/src/**/*.${extension}`,
    ),
    jsPlugins: [
      {
        name: "better-tailwindcss",
        specifier: "eslint-plugin-better-tailwindcss",
      },
    ],
    rules: {
      "better-tailwindcss/no-unknown-classes": "error",
      "better-tailwindcss/no-conflicting-classes": "error",
      "better-tailwindcss/no-duplicate-classes": "error",
      "better-tailwindcss/no-deprecated-classes": "error",
      "better-tailwindcss/no-unnecessary-whitespace": "error",
      "better-tailwindcss/enforce-canonical-classes": "error",
      "better-tailwindcss/enforce-consistent-class-order": "error",
      "better-tailwindcss/no-restricted-classes": restrictClasses([
        SCREEN_RESTRICTION,
      ]),
      "project/styling-boundary": ["error", { area: "screen" }],
    },
  },
  {
    files: [
      "**/apps/admin/src/ui/**",
      "**/apps/admin/src/features/*/ui/**",
      "**/apps/admin/src/components/*/ui/**",
    ],
    rules: {
      "better-tailwindcss/no-restricted-classes": restrictClasses(
        uiClassRestrictions("ui/"),
      ),
      "project/styling-boundary": ["error", { area: "ui" }],
      "project/max-classes-per-string": ["error", { max: 8 }],
    },
  },
  {
    files: ["**/apps/admin/src/ui/primitives/**"],
    rules: {
      "better-tailwindcss/no-restricted-classes": restrictClasses(
        uiClassRestrictions("ui/primitives/"),
      ),
    },
  },
  ...Object.keys(BORDER_CLASSES).map((file) => ({
    files: [`**/apps/admin/src/${file}`],
    rules: {
      "better-tailwindcss/no-restricted-classes": restrictClasses(
        uiClassRestrictions(file),
      ),
    },
  })),
  {
    files: ["**/apps/admin/src/ui/typography.ts"],
    rules: {
      "better-tailwindcss/no-restricted-classes": restrictClasses([
        ...UI_RESTRICTIONS,
        ...COLOR_USAGE_RESTRICTIONS,
        UNLISTED_TEXT_PAIR,
        LINE_STRONG_OUTSIDE_PRIMITIVES,
        borderRestriction(),
      ]),
    },
  },
  {
    files: ["**/apps/admin/src/**/__stories__/**"],
    rules: {
      "better-tailwindcss/no-restricted-classes": restrictClasses([
        SCREEN_RESTRICTION,
      ]),
      "project/styling-boundary": ["error", { area: "screen" }],
    },
  },
];

const UNRELATED_VARIABLES = new Set(["^classes$", "^styles?$"]);

/** class を検査するプラグインの設定。 */
export const ADMIN_CLASS_SETTINGS = {
  entryPoint: "src/ui/app.css",
  cwd: "apps/admin",
  selectors: [
    ...getDefaultSelectors().filter(
      (selector) =>
        !("name" in selector && UNRELATED_VARIABLES.has(selector.name)),
    ),
    { kind: "attribute", name: ".+ClassName$" },
    {
      kind: "attribute",
      name: ".+ClassName$",
      match: [{ type: "strings" }],
    },
    { kind: "variable", name: ".+ClassNames?$", match: [{ type: "strings" }] },
    { kind: "callee", name: "^merge$", match: [{ type: "strings" }] },
  ],
};
