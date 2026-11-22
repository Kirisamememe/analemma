import type { AllowWarnDeny } from "oxlint";

/** `no-restricted-imports` で止める、モジュールの名前。 */
type RestrictedPath = {
  /** モジュールの名前。 */
  readonly name: string;
  /** 止める名前付きの import。 */
  readonly importNames?: readonly string[];
  /** 型だけの import を許すか。 */
  readonly allowTypeImports?: boolean;
  /** 診断の文言。 */
  readonly message: string;
};

/** `no-restricted-imports` で止める、モジュールの名前の形。 */
type RestrictedPattern = {
  /** gitignore の書き方の、モジュールの名前の形。 */
  readonly group: readonly string[];
  /** 型だけの import を許すか。 */
  readonly allowTypeImports?: boolean;
  /** 診断の文言。 */
  readonly message: string;
};

/** `no-restricted-imports` の options。 */
type RestrictedImports = {
  /** 止めるモジュールの名前。 */
  readonly paths?: readonly RestrictedPath[];
  /** 止めるモジュールの名前の形。 */
  readonly patterns?: readonly RestrictedPattern[];
};

/** `no-restricted-globals` で止めるグローバル。 */
type RestrictedGlobal = {
  /** グローバルの名前。 */
  readonly name: string;
  /** 診断の文言。 */
  readonly message: string;
};

/** API の使い方を制限する、3つのルールの設定。 */
export type RestrictedApis = {
  /** 止める import。 */
  readonly imports: RestrictedImports;
  /** 止めるグローバル。 */
  readonly globals: readonly RestrictedGlobal[];
};

const BUN_MODULES = ["bun", "bun:*", "!bun:test", "hono/bun"];
const BUN_GLOBALS = ["Bun", "HTMLRewriter"];
const SERVER_BUN =
  "Bun 専用の API は src/platform/ と src/main.ts だけで使います。それ以外は Web 標準で書きます。";
const WORKSPACE_BUN =
  "Bun 専用の API は server の src/platform/ と src/main.ts だけで使います。";
const DATABASE =
  "Drizzle と DB のドライバを値として使えるのは *.query.ts と src/db/ と src/platform/ だけです。型だけなら import できます。";
const BUILDER =
  "procedure は procedures.ts の base(publicProcedures・authProcedures・adminProcedures)から作ります。素の builder は procedures.ts と router.ts だけで使います。";
const REACT =
  "React を使うコードは .tsx に置きます。.ts にはテストできるロジックだけを置きます。";

/** Drizzle と DB のドライバ。 */
export const DATABASE_PATHS: readonly RestrictedPath[] = [
  { name: "drizzle-orm", allowTypeImports: true, message: DATABASE },
  { name: "postgres", allowTypeImports: true, message: DATABASE },
];

/** Drizzle のサブパス。 */
export const DATABASE_PATTERNS: readonly RestrictedPattern[] = [
  { group: ["drizzle-orm/*"], allowTypeImports: true, message: DATABASE },
];

/** 素の oRPC の builder。 */
export const BUILDER_PATHS: readonly RestrictedPath[] = [
  {
    name: "@orpc/server",
    importNames: ["Builder", "implement", "os"],
    allowTypeImports: true,
    message: BUILDER,
  },
];

/** server の中の、Bun 専用のモジュール。 */
export const SERVER_BUN_PATTERNS: readonly RestrictedPattern[] = [
  { group: BUN_MODULES, message: SERVER_BUN },
];

/** server の中の、Bun 専用のグローバル。 */
export const SERVER_BUN_GLOBALS: readonly RestrictedGlobal[] = BUN_GLOBALS.map(
  (name) => ({ name, message: SERVER_BUN }),
);

/** server の外のワークスペースで止める、Bun と Node のモジュール。 */
export const WORKSPACE_RUNTIME_PATTERNS: readonly RestrictedPattern[] = [
  { group: BUN_MODULES, message: WORKSPACE_BUN },
  {
    group: ["node:*", "node:*/**"],
    message:
      "Node の API は server と tooling だけで使います。ここは Bun・Node・ブラウザのどれでも動くコードです。",
  },
];

/** server の外のワークスペースで止める、Bun のグローバル。 */
export const WORKSPACE_BUN_GLOBALS: readonly RestrictedGlobal[] = [
  { name: "Bun", message: WORKSPACE_BUN },
];

/** `ui/primitives/` の中でだけ使う、UI の外部ライブラリ。 */
export const UI_LIBRARY_PATTERNS: readonly RestrictedPattern[] = [
  {
    group: [
      "react-aria-components",
      "react-aria-components/*",
      "react-aria",
      "react-aria/*",
      "react-stately",
      "react-stately/*",
      "@react-aria/*",
      "@react-stately/*",
      "@internationalized/*",
    ],
    message:
      "React Aria Components は ui/primitives/ の中でだけ使います。ほかの場所は primitives の部品を使います。",
  },
  {
    group: ["lucide-react", "lucide-react/*"],
    message:
      "lucide-react は ui/primitives/ の中でだけ使います。ほかの場所は Icon を使います。",
  },
];

/** merge の設定を入れていない、tailwind-variants の入口。 */
export const VARIANT_LIBRARY_PATTERNS: readonly RestrictedPattern[] = [
  {
    group: [
      "tailwind-variants",
      "tailwind-variants/*",
      "tailwind-merge",
      "tailwind-merge/*",
    ],
    message:
      "tv と merge は ui/tv.ts から import します。theme.css の名前を merge の設定に入れてあります。",
  },
];

/** 管理画面の feature から import できるモジュールの範囲。 */
export const ADMIN_FEATURE_PATTERNS: readonly RestrictedPattern[] = [
  {
    group: [
      "**",
      "!react",
      "*/**/react",
      "!@analemma/contract",
      "!./**",
      "!../**",
      "!@/**",
    ],
    message:
      "管理画面の features で import できるのは、React (.tsx)・@analemma/contract・相対パスか @/ で指定する管理画面内のモジュールだけです。訳・API・認証器・server の状態は src/i18n/ と src/api/ の部品を、画面の部品は ui/ の部品を通して使います。Node と Bun の API は使いません。",
  },
];

/** 管理画面の `.ts` で止める、React。 */
export const REACT_PATHS: readonly RestrictedPath[] = [
  { name: "react", message: REACT },
  { name: "react-dom", message: REACT },
];

/** 3つのルールの設定を組み立てる。 */
export const restrictApis = ({
  imports,
  globals,
}: RestrictedApis): Record<string, [AllowWarnDeny, ...unknown[]]> => ({
  "eslint/no-restricted-imports": ["error", imports],
  "eslint/no-restricted-globals": ["error", ...globals],
  "eslint/no-restricted-properties": [
    "error",
    ...globals.map(({ name, message }) => ({
      object: "globalThis",
      property: name,
      message,
    })),
  ],
});
