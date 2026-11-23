import { spawnSync } from "node:child_process";
import {
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
import { buildPrompt, type TradeOffSection } from "./prompt";
import { pinRange, type PinnedRange } from "./range";
import { decideNextRound } from "./results";
import { extractTradeOffs } from "./trade-offs";

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

  const next = decideNextRound({ perspective, files: readdirSync(results) });

  if (next._tag === "Exhausted") {
    report(
      `${pinned.resultsBranch} は、「${perspective.label}」の観点で ${String(next.rounds)} 回レビューした。残った指摘は「割り切ったこと」に書くか、ユーザーに聞いてください(結果は ${results})。`,
    );

    return 1;
  }

  const reviewer =
    perspective.reviewer.runner === "subagent"
      ? perspective.reviewer
      : chooseReviewer(perspective.reviewer);

  if (typeof reviewer === "string") {
    report(reviewer);

    return 1;
  }

  const workspace = prepareWorkspace(pinned);
  const name = join(results, `${perspective.id}-${String(next.round)}`);
  const result = `${name}.md`;

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
    scope: readFileSync(join(PROMPTS, `${perspective.id}.md`), "utf8"),
    rules: readFileSync(join(PROMPTS, "common.md"), "utf8"),
    tradeOffs: collectTradeOffs({ head: pinned.head, tree: workspace.tree }),
  });

  writeFileSync(`${name}.prompt.md`, prompt);

  if (reviewer.runner === "subagent") {
    say(
      [
        `「${perspective.label}」の観点の ${String(next.round)} 回目は、Claude の subagent でレビューする。prompt を書き出した。`,
        `- prompt:${name}.prompt.md`,
        `- 結果を書く先:${result}`,
        `subagent に prompt のファイルを読ませ、返ってきた結果を、そのまま結果を書く先に書いてください。prompt で読ませるファイル(レビューするコミットの中身・差分・コミットのメッセージ)は ${workspace.root} に残してある。`,
      ].join("\n"),
    );

    return 0;
  }

  say(
    `「${perspective.label}」の観点の ${String(next.round)} 回目のレビューを、${RUNNER_NAMES[reviewer.runner]} の ${reviewer.model} で流す。数分から数十分かかる。`,
  );

  try {
    return runExternalReview({
      reviewer,
      paths: { tree: workspace.tree, context: workspace.context, result },
      log: `${name}.log`,
      prompt,
    });
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
