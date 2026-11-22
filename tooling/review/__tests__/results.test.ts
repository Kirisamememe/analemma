import { describe, expect, test } from "bun:test";

import { PERSPECTIVES, type Perspective } from "../perspectives";
import { decideNextRound, readVerdict } from "../results";

const perspectiveOf = (id: string): Perspective => {
  const found = PERSPECTIVES.find((perspective) => perspective.id === id);

  if (found === undefined) {
    throw new Error(`観点 ${id} が無い`);
  }

  return found;
};

const UI = perspectiveOf("ui");
const COHERENCE = perspectiveOf("coherence");

describe("次の回を決めること", () => {
  test("結果が無ければ、1回目にすること", () => {
    expect(decideNextRound({ perspective: UI, files: [] })).toEqual({
      _tag: "Next",
      round: 1,
    });
  });

  test("この観点の結果の、一番大きい番号の次にすること", () => {
    expect(
      decideNextRound({ perspective: UI, files: ["ui-2.md", "ui-1.md"] }),
    ).toEqual({ _tag: "Next", round: 3 });
    expect(decideNextRound({ perspective: UI, files: ["ui-2.md"] })).toEqual({
      _tag: "Next",
      round: 3,
    });
  });

  test("prompt と外の CLI の出力(`.log`)のファイル、ほかの観点の結果は数えないこと", () => {
    expect(
      decideNextRound({
        perspective: UI,
        files: [
          "ui-1.prompt.md",
          "ui-1.log",
          "logic-2.md",
          "ui-x.md",
          "ui-.md",
          "build-ui-1.md",
        ],
      }),
    ).toEqual({ _tag: "Next", round: 1 });
  });

  test("決めた回数を流し終えたら、次の回を出さないこと", () => {
    expect(
      decideNextRound({
        perspective: UI,
        files: ["ui-1.md", "ui-2.md", "ui-3.md"],
      }),
    ).toEqual({ _tag: "Exhausted", rounds: 3 });
    expect(
      decideNextRound({
        perspective: COHERENCE,
        files: ["coherence-1.md", "coherence-2.md"],
      }),
    ).toEqual({ _tag: "Exhausted", rounds: 2 });
  });
});

describe("結果の最後の行を読むこと", () => {
  test("VERDICT: LGTM を、LGTM と読むこと", () => {
    expect(readVerdict("## 指摘\n\n無し。\n\nVERDICT: LGTM\n")).toBe("lgtm");
  });

  test("VERDICT: CHANGES_REQUESTED を、直してほしいことがあると読むこと", () => {
    expect(
      readVerdict("## 指摘\n\n### 1. [中] 要約\n\nVERDICT: CHANGES_REQUESTED"),
    ).toBe("changes-requested");
  });

  test("最後の行の前後の空白と空行は読み飛ばすこと", () => {
    expect(readVerdict("本文\n  VERDICT: LGTM  \r\n\n\n")).toBe("lgtm");
  });

  test("最後の行でなければ、読めないものとすること", () => {
    expect(readVerdict("VERDICT: LGTM\n\n以上。\n")).toBeUndefined();
  });

  test("決めた形から外れた行は、読めないものとすること", () => {
    expect(readVerdict("**VERDICT: LGTM**")).toBeUndefined();
    expect(readVerdict("VERDICT: lgtm")).toBeUndefined();
    expect(readVerdict("")).toBeUndefined();
  });
});
