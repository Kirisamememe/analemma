import { parseArgs } from "node:util";

import { PERSPECTIVES, type Perspective } from "./perspectives";

/** 読み取れた引数。 */
export type ReviewArguments = {
  /** どの結果か。 */
  readonly _tag: "Parsed";
  /** レビューの観点。 */
  readonly perspective: Perspective;
  /** 比べる元のブランチ。 */
  readonly base: string;
  /** レビューするブランチの名前かコミットの指定。 */
  readonly head: string | undefined;
};

/** 引数を読めなかったこと。 */
export type InvalidArguments = {
  /** どの結果か。 */
  readonly _tag: "Invalid";
  /** 読めなかった理由。 */
  readonly problem: string;
};

/** `parseArgs` が読んだ option の値。 */
type OptionValues = {
  /** `--perspective` の値。 */
  readonly perspective?: string | undefined;
  /** `--base` の値。 */
  readonly base?: string | undefined;
  /** `--head` の値。 */
  readonly head?: string | undefined;
};

const readOptions = (argv: readonly string[]): OptionValues | string => {
  try {
    return parseArgs({
      args: [...argv],
      options: {
        perspective: { type: "string" },
        base: { type: "string" },
        head: { type: "string" },
      },
      strict: true,
      allowPositionals: false,
    }).values;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
};

const PERSPECTIVE_IDS = PERSPECTIVES.map(({ id }) => id).join("・");

/** `bun run review` の引数を読む。 */
export const parseReviewArguments = (
  argv: readonly string[],
): ReviewArguments | InvalidArguments => {
  const options = readOptions(argv);

  if (typeof options === "string") {
    return { _tag: "Invalid", problem: options };
  }

  const perspective = PERSPECTIVES.find(({ id }) => id === options.perspective);

  if (perspective === undefined) {
    return {
      _tag: "Invalid",
      problem: `--perspective には、${PERSPECTIVE_IDS} のどれかを渡してください。`,
    };
  }

  if (options.base === undefined || options.base === "") {
    return {
      _tag: "Invalid",
      problem: "--base に、比べる元のブランチを渡してください。",
    };
  }

  return {
    _tag: "Parsed",
    perspective,
    base: options.base,
    head: options.head === "" ? undefined : options.head,
  };
};
