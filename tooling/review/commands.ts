import type { CodexReviewer } from "./perspectives";

/** Cursor のモデルを選ぶための材料。 */
type CursorModelChoice = {
  /** 使いたいモデルの ID を、先に試す順に並べたもの。 */
  readonly candidates: readonly string[];
  /** `cursor-agent models` の出力。 */
  readonly listing: string;
};

const LINE_BREAK = /\r?\n/v;
const MODEL_LINE = /^(?<id>\S+) - /v;

/** 候補のうち、`cursor-agent models` に載っている最初のモデルを選ぶ。 */
export const chooseCursorModel = ({
  candidates,
  listing,
}: CursorModelChoice): string | undefined => {
  const available = new Set(
    listing
      .split(LINE_BREAK)
      .map((line) => MODEL_LINE.exec(line.trim())?.groups?.["id"])
      .filter((id) => id !== undefined),
  );

  return candidates.find((candidate) => available.has(candidate));
};

/** Cursor の CLI で、選んだモデルで流すレビュー。 */
export type CursorCall = {
  /** レビューを流すもの。 */
  readonly runner: "cursor";
  /** 選んだモデルの ID。 */
  readonly model: string;
};

/** 外の CLI に渡す場所。 */
export type ReviewPaths = {
  /** レビューするブランチの中身を書き出したフォルダ。 */
  readonly tree: string;
  /** 差分とコミットのメッセージを書き出したフォルダ。 */
  readonly context: string;
  /** 結果を書くファイル。 */
  readonly result: string;
};

/** コマンドを組み立てる材料。 */
type CommandRequest = {
  /** レビューを流すものとモデル。 */
  readonly reviewer: CodexReviewer | CursorCall;
  /** 外の CLI に渡す場所。 */
  readonly paths: ReviewPaths;
};

/** 外の CLI を、読み取り専用で呼ぶコマンド。 */
export type ReviewCommand = {
  /** 実行するファイル。 */
  readonly command: string;
  /** 引数。 */
  readonly args: readonly string[];
  /** 結果を、CLI がファイルに書くか、標準出力に出すか。 */
  readonly output: "file" | "stdout";
};

/** 観点に割り当てたモデルを、読み取り専用で呼ぶコマンドを組み立てる。 */
export const buildReviewCommand = ({
  paths,
  reviewer,
}: CommandRequest): ReviewCommand =>
  reviewer.runner === "codex"
    ? {
        command: "codex",
        args: [
          "exec",
          "-m",
          reviewer.model,
          "-c",
          `model_reasoning_effort="${reviewer.effort}"`,
          "-s",
          "read-only",
          "--skip-git-repo-check",
          "-C",
          paths.tree,
          "-o",
          paths.result,
          "-",
        ],
        output: "file",
      }
    : {
        command: "cursor-agent",
        args: [
          "-p",
          "--mode",
          "ask",
          "--trust",
          "--workspace",
          paths.tree,
          "--add-dir",
          paths.context,
          "--model",
          reviewer.model,
          "--output-format",
          "text",
        ],
        output: "stdout",
      };
