import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type { Perspective } from "../perspectives";

/** 前の回で結果を出した試行。 */
export type PreviousRound = {
  /** 前の回の番号。 */
  readonly round: number;
  /** 前の回がレビューしたコミットの SHA。 */
  readonly head: string;
  /** 前の回の結果のファイル。 */
  readonly result: string;
  /** 前の回の採否の記録のファイル。 */
  readonly decisions: string | undefined;
};

/** 前の回を探す材料。 */
type PreviousRoundQuery = {
  /** 結果のフォルダ。 */
  readonly results: string;
  /** レビューの観点。 */
  readonly perspective: Perspective;
  /** 今の回の番号。 */
  readonly round: number;
};

/** 結果を出した試行の番号と、レビューしたコミット。 */
type CompletedTrial = {
  /** 試行の番号。 */
  readonly trial: number;
  /** レビューしたコミットの SHA。 */
  readonly head: string;
};

const isObject = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === "object" && value !== null;

const readCompletedTrial = (text: string): CompletedTrial | undefined => {
  const record: unknown = JSON.parse(text);

  if (!isObject(record) || !isObject(record["head"])) {
    return undefined;
  }

  const { end, trial } = record;
  const head = record["head"]["commit"];
  const reason = isObject(end) ? end["reason"] : undefined;

  return typeof trial === "number" &&
    typeof head === "string" &&
    typeof reason === "string" &&
    reason !== "failed"
    ? { trial, head }
    : undefined;
};

/** 前の回の試行の記録から、結果を出した試行を探す。 */
export const findPreviousRound = ({
  perspective,
  results,
  round,
}: PreviousRoundQuery): PreviousRound | undefined => {
  const previous = round - 1;
  const name = `${perspective.id}-${String(previous)}`;

  const completed = readdirSync(results)
    .filter((file) => file.startsWith(`${name}.`) && file.endsWith(".json"))
    .map((file) =>
      readCompletedTrial(readFileSync(join(results, file), "utf8")),
    )
    .filter((trial) => trial !== undefined)
    .toSorted((a, b) => b.trial - a.trial)
    .at(0);

  const result = join(results, `${name}.md`);
  const decisions = join(results, `${name}.decisions.jsonl`);

  return completed === undefined || !existsSync(result)
    ? undefined
    : {
        round: previous,
        head: completed.head,
        result,
        decisions: existsSync(decisions) ? decisions : undefined,
      };
};
