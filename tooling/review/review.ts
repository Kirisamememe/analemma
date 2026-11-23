import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";

import { findMainCheckout } from "../structure/private-name-list";
import { parseReviewArguments, type ReviewArguments } from "./arguments";
import { chooseReviewer, runExternalReview } from "./external-review";
import { buildPrompt, type Rereview, type TradeOffSection } from "./prompt";
import { checkFixRange, pinRange, type PinnedRange } from "./range";
import { findPreviousRound, type PreviousRound } from "./records/previous";
import { decideNextRound } from "./records/results";
import { nextTrial, trialName, type TrialRecord } from "./records/trials";
import { extractTradeOffs } from "./trade-offs";

// ----------------------------------------
// コマンドと出力
// ----------------------------------------

const repoRoot = join(import.meta.dirname, "../..");
const PROMPTS = join(import.meta.dirname, "prompts");
const MAX_BUFFER = 256 * 1024 * 1024;

const USAGE =
  "使い方:bun run review -- --perspective <観点> --base <比べる元のブランチ> [--head <レビューするブランチの名前かコミット>]";

const RUNNER_NAMES = { codex: "Codex", cursor: "Cursor" } as const;

const execute = (command: string, args: readonly string[]) =>
  spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: MAX_BUFFER,
  });

const git = (...args: string[]): string => {
  const result = execute("git", args);

  if (result.status !== 0) {
    throw new Error(`git ${args.join(" ")} が失敗した:${result.stderr}`);
  }

  return result.stdout;
};

const report = (message: string): void => {
  process.stderr.write(`${message}\n`);
};

const say = (message: string): void => {
  process.stdout.write(`${message}\n`);
};

// ----------------------------------------
// レビューする側に渡すファイル
// ----------------------------------------

/** レビューする側に渡すファイルを書き出した場所。 */
type Workspace = {
  /** 一時フォルダ。 */
  readonly root: string;
  /** レビューするコミットの中身。 */
  readonly tree: string;
  /** 差分とコミットのメッセージ。 */
  readonly context: string;
  /** 差分のファイル。 */
  readonly diff: string;
  /** コミットのメッセージのファイル。 */
  readonly commits: string;
};

const prepareWorkspace = ({
  base,
  head,
}: Pick<PinnedRange, "base" | "head">): Workspace => {
  const root = mkdtempSync(join(tmpdir(), "analemma-review-"));

  const workspace = {
    root,
    tree: join(root, "tree"),
    context: join(root, "context"),
    diff: join(root, "context", "diff.patch"),
    commits: join(root, "context", "commits.txt"),
  };

  const archive = join(root, "tree.tar");

  mkdirSync(workspace.tree);
  mkdirSync(workspace.context);
  git("archive", "--format=tar", "-o", archive, head);

  const extracted = execute("tar", ["-x", "-f", archive, "-C", workspace.tree]);

  if (extracted.status !== 0) {
    throw new Error(`git archive の中身を展開できなかった:${extracted.stderr}`);
  }

  rmSync(archive);
  writeFileSync(
    workspace.diff,
    git("diff", "--find-renames", `${base}...${head}`),
  );
  writeFileSync(
    workspace.commits,
    git("log", "--reverse", "--format=commit %H%n%n%B", `${base}..${head}`),
  );

  return workspace;
};

/** 2回目からのレビューの材料を書き出す場所と、前の回。 */
type RereviewRequest = {
  /** 差分とコミットのメッセージを書き出したフォルダ。 */
  readonly context: string;
  /** 前の回。 */
  readonly previous: PreviousRound;
  /** 今の回にレビューするコミットの SHA。 */
  readonly head: string;
  /** ブランチの変更の全体をレビューするか。 */
  readonly full: boolean;
};

const readPrompt = (name: string): string =>
  readFileSync(join(PROMPTS, `${name}.md`), "utf8");

const prepareRereview = ({
  context,
  full,
  head,
  previous,
}: RereviewRequest): Rereview => {
  const result = join(context, "previous-result.md");

  const decisions =
    previous.decisions === undefined
      ? undefined
      : join(context, "previous-decisions.jsonl");

  copyFileSync(previous.result, result);

  if (previous.decisions !== undefined && decisions !== undefined) {
    copyFileSync(previous.decisions, decisions);
  }

  const fixes = full
    ? undefined
    : {
        diff: join(context, "fixes.patch"),
        commits: join(context, "fix-commits.txt"),
      };

  if (fixes !== undefined) {
    writeFileSync(
      fixes.diff,
      git("diff", "--find-renames", previous.head, head),
    );
    writeFileSync(
      fixes.commits,
      git(
        "log",
        "--reverse",
        "--format=commit %H%n%n%B",
        `${previous.head}..${head}`,
      ),
    );
  }

  return {
    round: previous.round,
    previousHead: previous.head,
    result,
    decisions,
    fixes,
    rules: [readPrompt("rereview"), ...(full ? [] : [readPrompt("fixes")])]
      .map((text) => text.trim())
      .join("\n\n"),
  };
};

const collectTradeOffs = ({
  head,
  tree,
}: Pick<PinnedRange, "head"> & Pick<Workspace, "tree">): TradeOffSection[] =>
  git("ls-tree", "-r", "-z", "--name-only", head)
    .split("\0")
    .filter((path) => basename(path) === "DECISIONS.md")
    .flatMap((path) => {
      const body = extractTradeOffs(readFileSync(join(tree, path), "utf8"));

      return body === undefined || body === "" ? [] : [{ path, body }];
    });

// ----------------------------------------
// レビューを流す
// ----------------------------------------

const review = (request: ReviewArguments): number => {
  const { base, perspective } = request;
  const pinned = pinRange(repoRoot, request);

  if (typeof pinned === "string") {
    report(pinned);

    return 2;
  }

  const results = join(
    findMainCheckout(repoRoot),
    ".private",
    "reviews",
    pinned.resultsBranch,
  );

  mkdirSync(results, { recursive: true });

  const files = readdirSync(results);
  const next = decideNextRound({ perspective, files });

  if (next._tag === "Exhausted") {
    report(
      `${pinned.resultsBranch} は、「${perspective.label}」の観点で ${String(next.rounds)} 回レビューした。残った指摘は「割り切ったこと」に書くか、ユーザーに聞いてください(結果は ${results})。`,
    );

    return 1;
  }

  const previous =
    next.round === 1
      ? undefined
      : findPreviousRound({ results, perspective, round: next.round });

  if (next.round > 1 && !request.full) {
    const problem =
      previous === undefined
        ? "前の回の試行の記録か結果が無いので、直したコミットを決められない。--full を付けて、ブランチの変更の全体をレビューしてください。"
        : checkFixRange(repoRoot, {
            previous,
            head: pinned.head,
          });

    if (problem !== undefined) {
      report(problem);

      return 2;
    }
  }

  const reviewer = chooseReviewer(perspective.reviewer);

  if (typeof reviewer === "string") {
    report(reviewer);

    return 1;
  }

  const workspace = prepareWorkspace(pinned);
  const round = { perspective: perspective.id, round: next.round };
  const trial = nextTrial({ perspective, round: next.round, files });
  const name = join(results, trialName({ ...round, trial }));
  const result = join(results, `${perspective.id}-${String(next.round)}.md`);

  const rereview =
    previous === undefined
      ? undefined
      : prepareRereview({
          context: workspace.context,
          previous,
          head: pinned.head,
          full: request.full,
        });

  const prompt = buildPrompt({
    perspective,
    base,
    headBranch: pinned.headBranch,
    baseCommit: pinned.base,
    headCommit: pinned.head,
    paths: {
      tree: workspace.tree,
      diff: workspace.diff,
      commits: workspace.commits,
    },
    scope: readPrompt(perspective.id),
    rules: readPrompt("common"),
    tradeOffs: collectTradeOffs({ head: pinned.head, tree: workspace.tree }),
    rereview,
  });

  writeFileSync(`${name}.prompt.md`, prompt);

  const record: TrialRecord = {
    ...round,
    trial,
    runner: reviewer.runner,
    model: reviewer.model,
    effort: reviewer.runner === "codex" ? reviewer.effort : undefined,
    base: { name: base, commit: pinned.base },
    head: { branch: pinned.headBranch ?? null, commit: pinned.head },
    scope: rereview?.fixes === undefined ? "branch" : "fixes",
    startedAt: new Date().toISOString(),
  };

  const writeRecord = (value: TrialRecord): void => {
    writeFileSync(`${name}.json`, `${JSON.stringify(value, null, 2)}\n`);
  };

  writeRecord(record);
  say(
    `「${perspective.label}」の観点の ${String(next.round)} 回目のレビューを、${RUNNER_NAMES[reviewer.runner]} の ${reviewer.model} で流す。数分から数十分かかる。`,
  );

  try {
    const end = runExternalReview({
      reviewer,
      paths: { tree: workspace.tree, context: workspace.context, result },
      log: `${name}.log`,
      prompt,
    });

    writeRecord({ ...record, end: { at: new Date().toISOString(), ...end } });

    return end.reason === "lgtm" || end.reason === "changes-requested" ? 0 : 1;
  } finally {
    rmSync(workspace.root, { recursive: true, force: true });
  }
};

const parsed = parseReviewArguments(process.argv.slice(2));

if (parsed._tag === "Invalid") {
  report(`${parsed.problem}\n${USAGE}`);
  process.exitCode = 2;
} else {
  process.exitCode = review(parsed);
}
