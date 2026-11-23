import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

/** lint が出した1件の診断。 */
export type Diagnostic = {
  /** 診断を出したルールの ID。 */
  readonly code: string;
  /** 診断の文言。 */
  readonly message: string;
  /** 診断を出した行(1から数える)。 */
  readonly line: number;
};

/** fixture を lint した結果。 */
export type FixtureLintResult = {
  /** 対象だけを lint したときの oxlint の終了コード。 */
  readonly status: number;
  /** 出た診断。 */
  readonly diagnostics: readonly Diagnostic[];
};

type FixtureDiagnostic = {
  /** 診断が出たファイルの、リポジトリの直下から数えたパス。 */
  readonly filename: string;
  /** 診断(ルールの ID の無い、使っていない抑制のコメントなどの診断では undefined)。 */
  readonly diagnostic: Diagnostic | undefined;
};

type FixturesReport = {
  /** lint したファイルの数。 */
  readonly files: number;
  /** 出た診断。 */
  readonly diagnostics: readonly FixtureDiagnostic[];
};

const repoRoot = join(import.meta.dirname, "../..");
const oxlintBin = join(repoRoot, "node_modules/.bin/oxlint");
const fixturesDir = "tooling/lint/fixtures";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const lineOf = (labels: unknown): number => {
  const label: unknown = Array.isArray(labels) ? labels.at(0) : undefined;
  const span = isRecord(label) ? label["span"] : undefined;

  return isRecord(span) && typeof span["line"] === "number" ? span["line"] : 0;
};

const toDiagnostic = (value: Record<string, unknown>): Diagnostic | undefined =>
  typeof value["code"] === "string" && typeof value["message"] === "string"
    ? {
        code: value["code"],
        message: value["message"],
        line: lineOf(value["labels"]),
      }
    : undefined;

const lintAllFixtures = (): FixturesReport => {
  const result = spawnSync(
    oxlintBin,
    [
      "--config",
      "oxlint.fixtures.config.ts",
      "--disable-nested-config",
      "--format",
      "json",
      fixturesDir,
    ],
    { cwd: repoRoot, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  );

  if (!result.stdout.trimStart().startsWith("{")) {
    throw new Error(
      `Oxlint が JSON の結果を出さなかった:\n${result.stderr}\n${result.stdout}`,
    );
  }

  const report: unknown = JSON.parse(result.stdout);

  const values: unknown[] =
    isRecord(report) && Array.isArray(report["diagnostics"])
      ? report["diagnostics"]
      : [];

  return {
    files:
      isRecord(report) && typeof report["number_of_files"] === "number"
        ? report["number_of_files"]
        : 0,
    diagnostics: values.flatMap((value) =>
      isRecord(value) && typeof value["filename"] === "string"
        ? [{ filename: value["filename"], diagnostic: toDiagnostic(value) }]
        : [],
    ),
  };
};

let fixturesReport: FixturesReport | undefined;

const fixturesReportOnce = (): FixturesReport => {
  fixturesReport ??= lintAllFixtures();

  return fixturesReport;
};

/** fixture のフォルダから数えたパスを、fixture 用の設定で lint する。 */
export const lintFixture = (target: string): FixtureLintResult => {
  const base = join(fixturesDir, target);

  if (!existsSync(join(repoRoot, base))) {
    throw new Error(`fixture が見つからない:${base}`);
  }

  const found = fixturesReportOnce().diagnostics.filter(
    ({ filename }) => filename === base || filename.startsWith(`${base}/`),
  );

  return {
    status: found.length > 0 ? 1 : 0,
    diagnostics: found.flatMap(({ diagnostic }) =>
      diagnostic === undefined ? [] : [diagnostic],
    ),
  };
};

/** fixture をまとめて lint したときに、oxlint が lint したファイルの数。 */
export const lintedFixtureCount = (): number => fixturesReportOnce().files;

/** lint の結果から、診断を出したルールの ID を取り出す。 */
export const ruleIdsOf = (result: FixtureLintResult): string[] =>
  result.diagnostics.map((diagnostic) => diagnostic.code);
