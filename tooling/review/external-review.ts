import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";

import {
  buildReviewCommand,
  chooseCursorModel,
  type CursorCall,
  type ReviewPaths,
} from "./commands";
import type { CodexReviewer, CursorReviewer } from "./perspectives";
import { readVerdict } from "./results";

const MAX_BUFFER = 256 * 1024 * 1024;

/** 流すコマンド。 */
type Invocation = {
  /** 実行するファイル。 */
  readonly command: string;
  /** 引数。 */
  readonly args: readonly string[];
  /** 標準入力に渡す文字列。 */
  readonly input?: string;
};

const execute = ({ args, command, input }: Invocation) =>
  spawnSync(command, args, { encoding: "utf8", maxBuffer: MAX_BUFFER, input });

/** 観点に割り当てたモデルのうち、使えるものを選ぶ。 */
export const chooseReviewer = (
  reviewer: CodexReviewer | CursorReviewer,
): CodexReviewer | CursorCall | string => {
  if (reviewer.runner === "codex") {
    return reviewer;
  }

  const listing = execute({ command: "cursor-agent", args: ["models"] });

  if (listing.error !== undefined || listing.status !== 0) {
    return `cursor-agent models が失敗した:${listing.error?.message ?? listing.stderr}`;
  }

  const model = chooseCursorModel({
    candidates: reviewer.models,
    listing: listing.stdout,
  });

  return model === undefined
    ? `Cursor の \`cursor-agent models\` に、${reviewer.models.join("・")} が無い。モデルを変えるかを、ユーザーに聞いてください。`
    : { runner: "cursor", model };
};

/** 外の CLI で流すレビュー。 */
type ExternalReview = {
  /** レビューを流すものとモデル。 */
  readonly reviewer: CodexReviewer | CursorCall;
  /** 外の CLI に渡す場所。 */
  readonly paths: ReviewPaths;
  /** 外の CLI の出力を書くファイル。 */
  readonly log: string;
  /** prompt。 */
  readonly prompt: string;
};

const report = (message: string): void => {
  process.stderr.write(`${message}\n`);
};

/** 外の CLI でレビューを流し、結果を書いて、終了コードを返す。 */
export const runExternalReview = ({
  log,
  paths,
  prompt,
  reviewer,
}: ExternalReview): number => {
  const command = buildReviewCommand({ reviewer, paths });
  const executed = execute({ ...command, input: prompt });

  if (executed.error !== undefined) {
    report(`${command.command} を流せなかった:${executed.error.message}`);

    return 1;
  }

  writeFileSync(
    log,
    command.output === "stdout"
      ? executed.stderr
      : `${executed.stdout}\n${executed.stderr}`,
  );

  if (executed.status === 0 && command.output === "stdout") {
    writeFileSync(paths.result, executed.stdout);
  }

  const text = existsSync(paths.result)
    ? readFileSync(paths.result, "utf8")
    : "";

  if (executed.status !== 0 || text.trim() === "") {
    rmSync(paths.result, { force: true });
    report(`レビューが失敗した。出力は ${log} にある。`);

    return 1;
  }

  const verdict = readVerdict(text);

  process.stdout.write(`結果:${paths.result}\n`);

  if (verdict === undefined) {
    report(
      "結果の最後の行が VERDICT: LGTM でも VERDICT: CHANGES_REQUESTED でもない。結果を読んで判断してください。",
    );

    return 1;
  }

  process.stdout.write(
    verdict === "lgtm"
      ? "判定:LGTM(重要度が高と中の指摘が無い)\n"
      : "判定:直してほしいことがある\n",
  );

  return 0;
};
