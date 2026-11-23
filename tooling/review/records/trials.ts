import type { Perspective } from "../perspectives";

/** 試行が終わった理由。 */
export type EndReason =
  | "lgtm"
  | "changes-requested"
  | "unreadable-verdict"
  | "failed";

/** 試行の終わり。 */
export type TrialEnd = {
  /** 終わった時刻(ISO 8601)。 */
  readonly at: string;
  /** 終わった理由。 */
  readonly reason: EndReason;
  /** 外の CLI の終了コード。 */
  readonly exitStatus: number | null;
};

/** `bun run review` を1回流した試行の記録。 */
export type TrialRecord = {
  /** 観点の名前(`--perspective` に渡す名前)。 */
  readonly perspective: string;
  /** 回の番号。 */
  readonly round: number;
  /** 同じ回の中での試行の番号。 */
  readonly trial: number;
  /** レビューを流したもの。 */
  readonly runner: "codex" | "cursor";
  /** 実際に使ったモデルの ID。 */
  readonly model: string;
  /** Codex の reasoning effort。 */
  readonly effort?: string | undefined;
  /** 比べる元。 */
  readonly base: {
    /** `--base` に渡した名前。 */
    readonly name: string;
    /** コミットの SHA。 */
    readonly commit: string;
  };
  /** レビューしたもの。 */
  readonly head: {
    /** レビューしたブランチの名前。 */
    readonly branch: string | null;
    /** コミットの SHA。 */
    readonly commit: string;
  };
  /** 始めた時刻(ISO 8601)。 */
  readonly startedAt: string;
  /** 試行の終わり。 */
  readonly end?: TrialEnd | undefined;
};

/** 試行の番号を決める材料。 */
type TrialQuery = {
  /** レビューの観点。 */
  readonly perspective: Perspective;
  /** 回の番号。 */
  readonly round: number;
  /** 結果のフォルダにあるファイルの名前。 */
  readonly files: readonly string[];
};

const RECORD_EXTENSION = ".json";
const DIGITS = /^\d+$/v;

/** 試行のファイルの名前から、拡張子を除いた部分。 */
export const trialName = ({
  perspective,
  round,
  trial,
}: Pick<TrialRecord, "perspective" | "round" | "trial">): string =>
  `${perspective}-${String(round)}.${String(trial)}`;

/** 結果のフォルダにある試行の記録から、この回の次の試行の番号を決める。 */
export const nextTrial = ({
  files,
  perspective,
  round,
}: TrialQuery): number => {
  const prefix = `${perspective.id}-${String(round)}.`;

  const trials = files
    .filter(
      (file) => file.startsWith(prefix) && file.endsWith(RECORD_EXTENSION),
    )
    .map((file) => file.slice(prefix.length, -RECORD_EXTENSION.length))
    .filter((digits) => DIGITS.test(digits))
    .map(Number);

  return Math.max(0, ...trials) + 1;
};
