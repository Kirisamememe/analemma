/** Codex で流すレビュー。 */
export type CodexReviewer = {
  /** レビューを流すもの。 */
  readonly runner: "codex";
  /** モデルの ID。 */
  readonly model: string;
  /** reasoning effort(`model_reasoning_effort`)。 */
  readonly effort: string;
};

/** Cursor の CLI で流すレビュー。 */
export type CursorReviewer = {
  /** レビューを流すもの。 */
  readonly runner: "cursor";
  /** モデルの ID を、先に試す順に並べたもの。 */
  readonly models: readonly string[];
};

/** prompt を書き出し、Claude の subagent に渡すレビュー。 */
export type SubagentReviewer = {
  /** レビューを流すもの。 */
  readonly runner: "subagent";
};

/** レビューを流すものとモデル。 */
export type Reviewer = CodexReviewer | CursorReviewer | SubagentReviewer;

/** レビューの観点。 */
export type Perspective = {
  /** `--perspective` に渡す名前で、prompt のファイルの名前。 */
  readonly id: string;
  /** 観点の名前。 */
  readonly label: string;
  /** レビューを流すものとモデル。 */
  readonly reviewer: Reviewer;
  /** 同じブランチを、この観点でレビューできる回数。 */
  readonly maxRounds: number;
};

const CODEX: CodexReviewer = {
  runner: "codex",
  model: "gpt-6.2-sol",
  effort: "xhigh",
};

const CHILD_BRANCH_ROUNDS = 3;
const PHASE_BRANCH_ROUNDS = 2;

export const PERSPECTIVES: readonly Perspective[] = [
  {
    id: "logic",
    label: "ビジネスロジック",
    reviewer: CODEX,
    maxRounds: CHILD_BRANCH_ROUNDS,
  },
  {
    id: "security",
    label: "セキュリティ",
    reviewer: CODEX,
    maxRounds: CHILD_BRANCH_ROUNDS,
  },
  {
    id: "ui",
    label: "UI/UX とアクセシビリティ",
    reviewer: {
      runner: "cursor",
      models: ["gemini-4-neon-xhigh", "grok-4.7-xhigh"],
    },
    maxRounds: CHILD_BRANCH_ROUNDS,
  },
  {
    id: "conventions",
    label: "規約やルールの遵守",
    reviewer: { runner: "cursor", models: ["grok-4.7-xhigh", "composer-2.5"] },
    maxRounds: CHILD_BRANCH_ROUNDS,
  },
  {
    id: "wording",
    label: "言葉",
    reviewer: { runner: "subagent" },
    maxRounds: CHILD_BRANCH_ROUNDS,
  },
  {
    id: "coherence",
    label: "つながりと一貫性",
    reviewer: CODEX,
    maxRounds: PHASE_BRANCH_ROUNDS,
  },
];
