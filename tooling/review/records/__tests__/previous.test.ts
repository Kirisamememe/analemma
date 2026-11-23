import { afterAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { PERSPECTIVES, type Perspective } from "../../perspectives";
import { findPreviousRound } from "../previous";
import type { EndReason } from "../trials";

const temporaryRoot = mkdtempSync(join(tmpdir(), "analemma-previous-test-"));

afterAll(() => {
  rmSync(temporaryRoot, { recursive: true, force: true });
});

const LOGIC = PERSPECTIVES.find(({ id }) => id === "logic");

if (LOGIC === undefined) {
  throw new Error("観点 logic が無い");
}

const perspective: Perspective = LOGIC;

const resultsFolder = (name: string): string => {
  const folder = join(temporaryRoot, name);

  mkdirSync(folder);

  return folder;
};

/** 書き出す試行の記録。 */
type TrialFixture = {
  /** 試行の番号。 */
  readonly trial: number;
  /** レビューしたコミット。 */
  readonly head: string;
  /** 終わった理由。 */
  readonly reason?: EndReason;
};

const writeTrial = (
  folder: string,
  { head, reason, trial }: TrialFixture,
): void => {
  writeFileSync(
    join(folder, `logic-1.${String(trial)}.json`),
    JSON.stringify({
      perspective: "logic",
      round: 1,
      trial,
      head: { branch: "claude/pages", commit: head },
      ...(reason === undefined
        ? {}
        : { end: { at: "2026-11-23T00:00:00.000Z", reason, exitStatus: 0 } }),
    }),
  );
};

describe("前の回を探すこと", () => {
  test("結果を出した試行がレビューしたコミットと、結果と採否の記録のファイルを返すこと", () => {
    const folder = resultsFolder("completed");

    writeTrial(folder, { trial: 1, head: "a", reason: "failed" });
    writeTrial(folder, { trial: 2, head: "b", reason: "changes-requested" });
    writeTrial(folder, { trial: 3, head: "c" });
    writeFileSync(join(folder, "logic-1.md"), "VERDICT: CHANGES_REQUESTED\n");
    writeFileSync(join(folder, "logic-1.decisions.jsonl"), "{}\n");

    expect(
      findPreviousRound({ results: folder, perspective, round: 2 }),
    ).toEqual({
      round: 1,
      head: "b",
      result: join(folder, "logic-1.md"),
      decisions: join(folder, "logic-1.decisions.jsonl"),
    });
  });

  test("採否の記録が無ければ、記録のファイルを返さないこと", () => {
    const folder = resultsFolder("no-decisions");

    writeTrial(folder, { trial: 1, head: "a", reason: "lgtm" });
    writeFileSync(join(folder, "logic-1.md"), "VERDICT: LGTM\n");

    expect(
      findPreviousRound({ results: folder, perspective, round: 2 }),
    ).toMatchObject({ head: "a", decisions: undefined });
  });

  test("結果を出した試行の記録か、結果のファイルが無ければ、見つからないとすること", () => {
    const withoutRecord = resultsFolder("without-record");

    writeFileSync(join(withoutRecord, "logic-1.md"), "VERDICT: LGTM\n");
    writeTrial(withoutRecord, { trial: 1, head: "a", reason: "failed" });

    const withoutResult = resultsFolder("without-result");

    writeTrial(withoutResult, { trial: 1, head: "a", reason: "lgtm" });

    for (const results of [withoutRecord, withoutResult]) {
      expect(
        findPreviousRound({ results, perspective, round: 2 }),
      ).toBeUndefined();
    }
  });
});
