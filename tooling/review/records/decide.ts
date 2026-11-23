import { spawnSync } from "node:child_process";
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { findMainCheckout } from "../../structure/private-name-list";
import {
  type DecisionArguments,
  type DecisionRecord,
  findingNumbers,
  parseDecisionArguments,
} from "./decisions";

const repoRoot = join(import.meta.dirname, "../../..");

const USAGE =
  "使い方:bun run review:decide -- --perspective <観点> --round <回> --findings <番号>[,<番号>…] --outcome <fixed・rejected・trade-off・kept-low> [--commit <直したコミット>] [--reason <根拠>] [--branch <結果を書いたブランチ>]";

const readGit = (...args: string[]): string | undefined => {
  const result = spawnSync("git", args, { cwd: repoRoot, encoding: "utf8" });

  return result.status === 0 ? result.stdout.trim() || undefined : undefined;
};

const report = (message: string): void => {
  process.stderr.write(`${message}\n`);
};

const resolveCommit = (revision: string): string | undefined =>
  readGit(
    "rev-parse",
    "--verify",
    "--quiet",
    "--end-of-options",
    `${revision}^{commit}`,
  );

const decide = (request: DecisionArguments): number => {
  const branch = request.branch ?? readGit("branch", "--show-current");

  if (branch === undefined) {
    report(
      "今のブランチが無い(detached HEAD)。--branch に、結果を書いたブランチを渡してください。",
    );

    return 2;
  }

  const results = join(
    findMainCheckout(repoRoot),
    ".private",
    "reviews",
    branch,
  );

  const name = `${request.perspective.id}-${String(request.round)}`;
  const result = join(results, `${name}.md`);

  if (!existsSync(result)) {
    report(`${result} が無い。観点・回・ブランチを確かめてください。`);

    return 1;
  }

  const known = findingNumbers(readFileSync(result, "utf8"));
  const unknown = request.findings.filter((number) => !known.includes(number));

  if (unknown.length > 0) {
    report(`${name} の結果に、指摘 ${unknown.join("・")} が無い。`);

    return 1;
  }

  const commit =
    request.commit === undefined ? undefined : resolveCommit(request.commit);

  if (request.commit !== undefined && commit === undefined) {
    report(`${request.commit} を、コミットに解決できなかった。`);

    return 1;
  }

  const record: DecisionRecord = {
    findings: request.findings,
    outcome: request.outcome,
    commit,
    reason: request.reason,
    recordedAt: new Date().toISOString(),
  };

  appendFileSync(
    join(results, `${name}.decisions.jsonl`),
    `${JSON.stringify(record)}\n`,
  );
  process.stdout.write(
    `${name} の指摘 ${request.findings.join("・")} を ${request.outcome} と記録した。\n`,
  );

  return 0;
};

const parsed = parseDecisionArguments(process.argv.slice(2));

if (parsed._tag === "Invalid") {
  report(`${parsed.problem}\n${USAGE}`);
  process.exitCode = 2;
} else {
  process.exitCode = decide(parsed);
}
