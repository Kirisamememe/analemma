import { parseArgs } from "node:util";

import type { InvalidArguments } from "../arguments";
import { PERSPECTIVES, type Perspective } from "../perspectives";

/** 指摘の採否。 */
export type Outcome = "fixed" | "rejected" | "trade-off" | "kept-low";

const OUTCOMES: readonly Outcome[] = [
  "fixed",
  "rejected",
  "trade-off",
  "kept-low",
];

/** 読み取れた、採否を記録する引数。 */
export type DecisionArguments = {
  /** どの結果か。 */
  readonly _tag: "Parsed";
  /** レビューの観点。 */
  readonly perspective: Perspective;
  /** 回の番号。 */
  readonly round: number;
  /** 指摘の番号。 */
  readonly findings: readonly number[];
  /** 採否。 */
  readonly outcome: Outcome;
  /** 直したコミットの指定。 */
  readonly commit: string | undefined;
  /** 根拠。 */
  readonly reason: string | undefined;
  /** 結果を書いたブランチ。 */
  readonly branch: string | undefined;
};

/** 採否の記録の1行。 */
export type DecisionRecord = {
  /** 指摘の番号。 */
  readonly findings: readonly number[];
  /** 採否。 */
  readonly outcome: Outcome;
  /** 直したコミットの SHA。 */
  readonly commit?: string | undefined;
  /** 根拠。 */
  readonly reason?: string | undefined;
  /** 記録した時刻(ISO 8601)。 */
  readonly recordedAt: string;
};

const OPTION_NAMES = [
  "perspective",
  "round",
  "findings",
  "outcome",
  "commit",
  "reason",
  "branch",
] as const;

/** `parseArgs` が読んだ option の値。 */
type OptionValues = Partial<
  Record<(typeof OPTION_NAMES)[number], string | undefined>
>;

const STRING = { type: "string" } as const;
const POSITIVE_INTEGER = /^[1-9]\d*$/v;
const FINDING_HEADING = /^### (?<number>[1-9]\d*)\. /gmv;

const readOptions = (argv: readonly string[]): OptionValues | string => {
  try {
    return parseArgs({
      args: [...argv],
      options: Object.fromEntries(OPTION_NAMES.map((name) => [name, STRING])),
      strict: true,
      allowPositionals: false,
    }).values;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
};

const nonEmpty = (value: string | undefined): string | undefined =>
  value === undefined || value.trim() === "" ? undefined : value;

const invalid = (problem: string): InvalidArguments => ({
  _tag: "Invalid",
  problem,
});

const readFindings = (value: string): readonly number[] | undefined => {
  const parts = value.split(",").map((part) => part.trim());

  return parts.every((part) => POSITIVE_INTEGER.test(part))
    ? [...new Set(parts.map(Number))].toSorted((a, b) => a - b)
    : undefined;
};

/** `bun run review:decide` の引数を読む。 */
export const parseDecisionArguments = (
  argv: readonly string[],
): DecisionArguments | InvalidArguments => {
  const options = readOptions(argv);

  if (typeof options === "string") {
    return invalid(options);
  }

  const perspective = PERSPECTIVES.find(({ id }) => id === options.perspective);

  if (perspective === undefined) {
    return invalid(
      `--perspective には、${PERSPECTIVES.map(({ id }) => id).join("・")} のどれかを渡してください。`,
    );
  }

  if (!POSITIVE_INTEGER.test(options.round ?? "")) {
    return invalid("--round に、回の番号(1から)を渡してください。");
  }

  const findings = readFindings(options.findings ?? "");

  if (findings === undefined) {
    return invalid(
      "--findings に、指摘の番号をコンマで区切って渡してください。",
    );
  }

  const outcome = OUTCOMES.find((value) => value === options.outcome);

  if (outcome === undefined) {
    return invalid(
      `--outcome には、${OUTCOMES.join("・")} のどれかを渡してください。`,
    );
  }

  const commit = nonEmpty(options.commit);
  const reason = nonEmpty(options.reason);

  if (outcome === "fixed" && commit === undefined) {
    return invalid("fixed には、--commit に直したコミットを渡してください。");
  }

  if (outcome !== "fixed" && reason === undefined) {
    return invalid(`${outcome} には、--reason に根拠を渡してください。`);
  }

  return {
    _tag: "Parsed",
    perspective,
    round: Number(options.round),
    findings,
    outcome,
    commit,
    reason,
    branch: nonEmpty(options.branch),
  };
};

/** 結果の「## 指摘」にある、指摘の番号を読む。 */
export const findingNumbers = (result: string): readonly number[] =>
  [...result.matchAll(FINDING_HEADING)].map((match) =>
    Number(match.groups?.["number"]),
  );
