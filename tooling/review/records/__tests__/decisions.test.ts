import { describe, expect, test } from "bun:test";

import { findingNumbers, parseDecisionArguments } from "../decisions";

const parse = (options: Readonly<Record<string, string>>) =>
  parseDecisionArguments(
    Object.entries(options).flatMap(([name, value]) => [`--${name}`, value]),
  );

const problemOf = (options: Readonly<Record<string, string>>): string => {
  const parsed = parse(options);

  return parsed._tag === "Invalid" ? parsed.problem : "引数を読めてしまった";
};

const FINDING = { perspective: "logic", round: "2", findings: "1" };

describe("bun run review:decide の引数を読むこと", () => {
  test("直した指摘を、直したコミットと一緒に読むこと", () => {
    expect(
      parse({ ...FINDING, outcome: "fixed", commit: "abc1234" }),
    ).toMatchObject({
      _tag: "Parsed",
      perspective: { id: "logic" },
      round: 2,
      findings: [1],
      outcome: "fixed",
      commit: "abc1234",
      reason: undefined,
      branch: undefined,
    });
  });

  test("いくつもの指摘の番号を、重ねずに小さい順にして1つの記録にまとめること", () => {
    expect(
      parse({ ...FINDING, findings: "3, 1,3", outcome: "fixed", commit: "a" }),
    ).toMatchObject({ _tag: "Parsed", findings: [1, 3] });
  });

  test("直したコミットが無い fixed は、読まないこと", () => {
    expect(
      problemOf({ ...FINDING, outcome: "fixed", reason: "直した" }),
    ).toContain("--commit");
  });

  test("fixed のほかは、根拠が無ければ読まないこと", () => {
    for (const outcome of ["rejected", "trade-off", "kept-low"]) {
      expect(problemOf({ ...FINDING, outcome, reason: "  " })).toContain(
        "--reason",
      );
    }
  });

  test("退けた指摘に、戻したコミットと根拠と、結果を書いたブランチを付けられること", () => {
    expect(
      parse({
        ...FINDING,
        outcome: "rejected",
        reason: "直した後に、経路が無いと分かって戻した",
        commit: "def5678",
        branch: "phase/3",
      }),
    ).toMatchObject({
      _tag: "Parsed",
      outcome: "rejected",
      commit: "def5678",
      branch: "phase/3",
    });
  });

  test("決めた採否のほかは、読まないこと", () => {
    expect(
      problemOf({ ...FINDING, outcome: "ignored", reason: "根拠" }),
    ).toContain("--outcome");
  });

  test("回と指摘の番号は、1からの整数だけを読むこと", () => {
    const decided = { outcome: "kept-low", reason: "根拠" };

    for (const round of ["0", "1.5", "", "x"]) {
      expect(problemOf({ ...FINDING, ...decided, round })).toContain("--round");
    }

    for (const findings of ["0", "1,", "1,x", ""]) {
      expect(problemOf({ ...FINDING, ...decided, findings })).toContain(
        "--findings",
      );
    }
  });

  test("観点の名前が無いものと、知らない option は、読まないこと", () => {
    const decided = { outcome: "kept-low", reason: "根拠" };

    expect(
      problemOf({ ...FINDING, ...decided, perspective: "style" }),
    ).toContain("--perspective");
    expect(problemOf({ ...FINDING, ...decided, sha: "x" })).toContain("--sha");
  });
});

describe("結果から指摘の番号を読むこと", () => {
  test("「## 指摘」の見出しの番号を、出てきた順に読むこと", () => {
    const result = [
      "## 指摘",
      "",
      "### 1. [中] 一つ目",
      "",
      "- 場所:`a.ts:1`",
      "",
      "### 2. [低] 二つ目",
      "",
      "## まとめ",
      "",
      "VERDICT: CHANGES_REQUESTED",
    ].join("\n");

    expect(findingNumbers(result)).toEqual([1, 2]);
  });

  test("指摘が無い結果からは、何も読まないこと", () => {
    expect(
      findingNumbers("## 指摘\n\n無し。\n\n## まとめ\n\nVERDICT: LGTM\n"),
    ).toEqual([]);
  });
});
