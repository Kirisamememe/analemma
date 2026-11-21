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
    group: ["node:*"],
    message:
      "Node の API は server と tooling だけで使います。ここは Bun・Node・ブラウザのどれでも動くコードです。",
  },
];

/** server の外のワークスペースで止める、Bun のグローバル。 */
export const WORKSPACE_BUN_GLOBALS: readonly RestrictedGlobal[] = [
  { name: "Bun", message: WORKSPACE_BUN },
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
