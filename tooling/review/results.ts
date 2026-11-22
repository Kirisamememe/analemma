import type { Perspective } from "./perspectives";

/** 次の回の番号を決める材料。 */
type RoundQuery = {
  /** レビューの観点。 */
  readonly perspective: Perspective;
  /** 結果のフォルダにあるファイルの名前。 */
  readonly files: readonly string[];
};

/** 次に流す回。 */
export type NextRound = {
  /** 結果の種類。 */
  readonly _tag: "Next";
  /** 次の回の番号で、1から数える。 */
  readonly round: number;
};

/** 決めた回数を流し終えたこと。 */
export type RoundsExhausted = {
  /** 結果の種類。 */
  readonly _tag: "Exhausted";
  /** 流し終えた回数。 */
  readonly rounds: number;
};

const DIGITS = /^\d+$/v;
const RESULT_EXTENSION = ".md";

const roundOf = (
  perspective: Perspective,
  file: string,
): number | undefined => {
  const prefix = `${perspective.id}-`;

  if (!file.startsWith(prefix) || !file.endsWith(RESULT_EXTENSION)) {
    return undefined;
  }

  const digits = file.slice(prefix.length, -RESULT_EXTENSION.length);

  return DIGITS.test(digits) ? Number(digits) : undefined;
};

/** 結果のファイルの名前から、この観点の次の回を決める。 */
export const decideNextRound = ({
  files,
  perspective,
}: RoundQuery): NextRound | RoundsExhausted => {
  const round =
    Math.max(
      0,
      ...files
        .map((file) => roundOf(perspective, file))
        .filter((value) => value !== undefined),
    ) + 1;

  return round > perspective.maxRounds
    ? { _tag: "Exhausted", rounds: perspective.maxRounds }
    : { _tag: "Next", round };
};

/** 結果の最後の行から、LGTM か、直してほしいことがあるかを読む。 */
export const readVerdict = (
  result: string,
): "lgtm" | "changes-requested" | undefined => {
  const lastLine = result.trimEnd().split("\n").at(-1)?.trim();

  if (lastLine === "VERDICT: LGTM") {
    return "lgtm";
  }

  return lastLine === "VERDICT: CHANGES_REQUESTED"
    ? "changes-requested"
    : undefined;
};
