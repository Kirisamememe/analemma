/** ルールを外すファイルと、外す理由。 */
type RuleExemption = {
  /** 外すルール。 */
  readonly rule: string;
  /** 外す理由。 */
  readonly reason: string;
  /** 外すファイルの、リポジトリの直下から数えたパス。 */
  readonly files: readonly string[];
};

const SEQUENTIAL = "eslint/no-await-in-loop";

/** 抑制のコメントの代わりにここに集める、ルールを外すファイルの一覧。 */
export const RULE_EXEMPTIONS: readonly RuleExemption[] = [
  {
    rule: "project/max-code-lines",
    reason:
      "訳は、言語ごとに1ファイルに置く。言語を並べて見比べ、訳の抜けを見つけるため。",
    files: [
      "apps/admin/src/i18n/messages/en.ts",
      "apps/admin/src/i18n/messages/ja.ts",
    ],
  },
  {
    rule: "project/max-code-lines",
    reason:
      "一覧にある400行を超えるファイルを、lint が通すことを確かめる fixture。",
    files: ["tooling/lint/fixtures/valid/files/800-lines-with-exception.ts"],
  },
  {
    rule: "typescript/consistent-type-definitions",
    reason:
      "ライブラリの型の登録は、declare module の中の interface の宣言のマージでしか書けない。",
    files: [
      "apps/admin/src/app/router.ts",
      "apps/admin/src/i18n/resources.ts",
      "apps/admin/src/ui/css-variables.ts",
    ],
  },
  {
    rule: "typescript/dot-notation",
    reason:
      ".storybook/ では、型付きの lint が noPropertyAccessFromIndexSignature を読まず、tsc が求める dataset の添字の書き方を止める。",
    files: ["apps/admin/.storybook/use-html-preferences.ts"],
  },
  {
    rule: "jsx-a11y/no-noninteractive-tabindex",
    reason: "WebKit では、スクロールする情報欄に Tab で移れない。",
    files: ["apps/admin/src/features/images/ui/viewer/image-viewer.tsx"],
  },
  {
    rule: "project/no-dynamic-import",
    reason:
      "CLI が読む利用者の定義のファイルは、実行するときにしかパスが分からない。",
    files: ["packages/client/src/cli/main.ts"],
  },
  {
    rule: "node/no-process-env",
    reason: "CLI は、実行する環境の変数を入口で読む。",
    files: ["packages/client/src/cli/main.ts"],
  },
  {
    rule: SEQUENTIAL,
    reason: "Dropbox の次のページは、前のページの cursor で読む。",
    files: ["apps/server/src/platform/dropbox/dropbox-files.ts"],
  },
  {
    rule: SEQUENTIAL,
    reason:
      "配信用の画像は1段ずつ順に作り、メモリの山を1段の分に抑える。書き込みは、失敗した書き込みの後始末より後に別のファイルを作らない。",
    files: [
      "apps/server/src/features/images/processing/create-delivery-images.ts",
      "apps/server/src/features/images/creating/store-delivery-images.ts",
    ],
  },
  {
    rule: SEQUENTIAL,
    reason:
      "変換を待つ写真は、受け取った順に1枚ずつ流し、待つ間に足された変換も待つ。",
    files: [
      "apps/server/src/features/images/creating/pending-photos.ts",
      "apps/server/src/features/images/creating/resume-pending-images.ts",
      "apps/server/src/features/dropbox/importing/run-dropbox-import.ts",
    ],
  },
];

/** 一覧から作る、ファイルごとにルールを外す設定。 */
export const RULE_EXEMPTION_OVERRIDES = RULE_EXEMPTIONS.map(
  ({ rule, files }) => ({
    files: files.map((file) => `**/${file}`),
    rules: { [rule]: "off" as const },
  }),
);
