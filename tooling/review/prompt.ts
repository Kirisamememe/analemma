import type { Perspective } from "./perspectives";

/** 1つの `DECISIONS.md` の「割り切ったこと」。 */
export type TradeOffSection = {
  /** `DECISIONS.md` の、リポジトリの直下からのパス。 */
  readonly path: string;
  /** 節の中身。 */
  readonly body: string;
};

/** レビューする側が読むファイルの場所。 */
export type PromptPaths = {
  /** レビューするブランチの中身を書き出したフォルダ。 */
  readonly tree: string;
  /** 差分のファイル。 */
  readonly diff: string;
  /** コミットのメッセージのファイル。 */
  readonly commits: string;
  /** 同じ観点の、前の回の結果のファイル。 */
  readonly previous: readonly string[];
};

/** 依頼文を組み立てる材料。 */
export type PromptMaterial = {
  /** レビューの観点。 */
  readonly perspective: Perspective;
  /** 比べる元のブランチ。 */
  readonly base: string;
  /** レビューするブランチ。 */
  readonly head: string;
  /** レビューする側が読むファイルの場所。 */
  readonly paths: PromptPaths;
  /** 観点ごとの依頼文。 */
  readonly scope: string;
  /** どの観点にも共通の依頼文。 */
  readonly rules: string;
  /** 各 `DECISIONS.md` の「割り切ったこと」。 */
  readonly tradeOffs: readonly TradeOffSection[];
};

const code = (text: string): string => `\`${text}\``;

const previousLine = (previous: readonly string[]): string[] =>
  previous.length === 0
    ? []
    : [
        `- 前の回の結果:${previous.map((path) => code(path)).join("、")}。前の回の指摘が直ったかも確かめる。直さずに「割り切ったこと」に書いたものは、指摘し直さない。`,
      ];

const tradeOffSection = (tradeOffs: readonly TradeOffSection[]): string =>
  [
    "## 割り切ったこと",
    "",
    "各 `DECISIONS.md` の末尾の「割り切ったこと」を集めたもの。",
    ...tradeOffs.flatMap(({ body, path }) => [
      "",
      `### ${code(path)}`,
      "",
      body,
    ]),
  ].join("\n");

/** 観点ごとの依頼文に、読むものと割り切ったことを添えて、依頼文を組み立てる。 */
export const buildPrompt = ({
  base,
  head,
  paths,
  perspective,
  rules,
  scope,
  tradeOffs,
}: PromptMaterial): string =>
  [
    `# レビューの依頼:「${perspective.label}」の観点`,
    "",
    `個人サイトのためのヘッドレス CMS「Analemma」のリポジトリで、ブランチ ${code(head)} の変更を、${code(base)} と比べて、「${perspective.label}」の観点だけでレビューする。`,
    "",
    "## 読むもの",
    "",
    `- 変更後のファイル:${code(paths.tree)}。ブランチ ${code(head)} にコミットした中身で、git の履歴は無い。`,
    `- 差分:${code(paths.diff)}(${code(`git diff ${base}...${head}`)})`,
    `- コミットのメッセージ:${code(paths.commits)}`,
    "- リポジトリの約束:変更後のファイルの直下の `AGENTS.md`・`DECISIONS.md`・`GLOSSARY.md` と、変更したファイルに近いフォルダの `AGENTS.md`・`DECISIONS.md`",
    ...previousLine(paths.previous),
    "",
    scope.trim(),
    "",
    tradeOffSection(tradeOffs),
    "",
    rules.trim(),
    "",
  ].join("\n");
