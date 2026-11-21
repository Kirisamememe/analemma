import { spawnSync } from "node:child_process";
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
  /** oxlint の終了コード。 */
  readonly status: number | null;
  /** lint したファイルの数。 */
  readonly files: number;
  /** 出た診断。 */
  readonly diagnostics: readonly Diagnostic[];
};

const repoRoot = join(import.meta.dirname, "../..");
const oxlintBin = join(repoRoot, "node_modules/.bin/oxlint");

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const lineOf = (labels: unknown): number => {
  const label: unknown = Array.isArray(labels) ? labels.at(0) : undefined;
  const span = isRecord(label) ? label["span"] : undefined;

  return isRecord(span) && typeof span["line"] === "number" ? span["line"] : 0;
};

const toDiagnostic = (value: unknown): Diagnostic[] =>
  isRecord(value) &&
  typeof value["code"] === "string" &&
  typeof value["message"] === "string"
    ? [
        {
          code: value["code"],
          message: value["message"],
          line: lineOf(value["labels"]),
        },
      ]
    : [];

/** fixture のフォルダから数えたパスを、fixture 用の設定で lint する。 */
export const lintFixture = (target: string): FixtureLintResult => {
  const result = spawnSync(
    oxlintBin,
    [
      "--config",
      "oxlint.fixtures.config.ts",
      "--disable-nested-config",
      "--format",
      "json",
      join("tooling/lint/fixtures", target),
    ],
    { cwd: repoRoot, encoding: "utf8" },
  );

  if (!result.stdout.trimStart().startsWith("{")) {
    throw new Error(
      `Oxlint が JSON の結果を出さなかった:\n${result.stderr}\n${result.stdout}`,
    );
  }

  const report: unknown = JSON.parse(result.stdout);

  return {
    status: result.status,
    files:
      isRecord(report) && typeof report["number_of_files"] === "number"
        ? report["number_of_files"]
        : 0,
    diagnostics:
      isRecord(report) && Array.isArray(report["diagnostics"])
        ? report["diagnostics"].flatMap((value: unknown) => toDiagnostic(value))
        : [],
  };
};

/** lint の結果から、診断を出したルールの ID を取り出す。 */
export const ruleIdsOf = (result: FixtureLintResult): string[] =>
  result.diagnostics.map((diagnostic) => diagnostic.code);
