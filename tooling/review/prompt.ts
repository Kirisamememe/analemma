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
};

/** prompt を組み立てる材料。 */
export type PromptMaterial = {
  /** レビューの観点。 */
  readonly perspective: Perspective;
  /** 比べる元のブランチ。 */
  readonly base: string;
  /** レビューするブランチ。 */
  readonly head: string;
  /** 比べる元のブランチの、今のコミットの SHA。 */
  readonly baseCommit: string;
  /** レビューするブランチの、今のコミットの SHA。 */
  readonly headCommit: string;
  /** レビューする側が読むファイルの場所。 */
  readonly paths: PromptPaths;
  /** 観点ごとの prompt。 */
  readonly scope: string;
  /** どの観点にも共通の prompt。 */
  readonly rules: string;
  /** 各 `DECISIONS.md` の「割り切ったこと」。 */
  readonly tradeOffs: readonly TradeOffSection[];
};

const code = (text: string): string => `\`${text}\``;

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

/** 観点ごとの prompt に、読むものと「割り切ったこと」を添えて、prompt を組み立てる。 */
export const buildPrompt = ({
  base,
  baseCommit,
  head,
  headCommit,
  paths,
  perspective,
  rules,
  scope,
  tradeOffs,
}: PromptMaterial): string =>
  [
    `# レビューの依頼:「${perspective.label}」の観点`,
    "",
    `個人サイトのためのヘッドレス CMS「Analemma」のリポジトリで、ブランチ ${code(head)}(コミット ${code(headCommit)})の変更を、${code(base)}(コミット ${code(baseCommit)})と比べて、「${perspective.label}」の観点だけでレビューする。`,
    "",
    "## 読むもの",
    "",
    `- レビューするブランチの中身:${code(paths.tree)}。ブランチ ${code(head)} にコミットしたすべてのファイル(変えていないものも含む)で、git の履歴は無い。以下の「直下」は、このフォルダの直下を指す。`,
    `- 差分:${code(paths.diff)}(${code(`git diff ${base}...${head}`)})`,
    `- コミットのメッセージ:${code(paths.commits)}`,
    "- リポジトリの約束:このフォルダの直下の `AGENTS.md`・`DECISIONS.md`・`GLOSSARY.md` と、変更したファイルに近いフォルダの `AGENTS.md`・`DECISIONS.md`",
    "",
    scope.trim(),
    "",
    tradeOffSection(tradeOffs),
    "",
    rules.trim(),
    "",
  ].join("\n");
