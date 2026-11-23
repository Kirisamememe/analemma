import { describe, expect, test } from "bun:test";

import { PERSPECTIVES, type Perspective } from "../../perspectives";
import { decideNextRound } from "../results";
import { nextTrial, trialName } from "../trials";

const perspectiveOf = (id: string): Perspective => {
  const found = PERSPECTIVES.find((perspective) => perspective.id === id);

  if (found === undefined) {
    throw new Error(`観点 ${id} が無い`);
  }

  return found;
};

const LOGIC = perspectiveOf("logic");

describe("試行のファイルの名前", () => {
  test("観点・回・試行の番号から作ること", () => {
    expect(trialName({ perspective: "logic", round: 2, trial: 3 })).toBe(
      "logic-2.3",
    );
  });

  test("試行のファイルは、回の数え方に入らないこと", () => {
    expect(
      decideNextRound({
        perspective: LOGIC,
        files: [
          "logic-1.md",
          "logic-2.1.json",
          "logic-2.1.log",
          "logic-2.1.prompt.md",
          "logic-1.decisions.jsonl",
        ],
      }),
    ).toEqual({ _tag: "Next", round: 2 });
  });
});

describe("次の試行の番号を決めること", () => {
  test("この回の試行が無ければ、1にすること", () => {
    expect(nextTrial({ perspective: LOGIC, round: 1, files: [] })).toBe(1);
  });

  test("失敗した試行があれば、その次の番号にして上書きしないこと", () => {
    expect(
      nextTrial({
        perspective: LOGIC,
        round: 2,
        files: [
          "logic-1.1.json",
          "logic-1.md",
          "logic-2.1.json",
          "logic-2.1.log",
          "logic-2.2.json",
        ],
      }),
    ).toBe(3);
  });

  test("ほかの回・ほかの観点の記録と、記録でないファイルは数えないこと", () => {
    expect(
      nextTrial({
        perspective: LOGIC,
        round: 1,
        files: [
          "logic-12.4.json",
          "ui-1.5.json",
          "logic-1.6.log",
          "logic-1.6.prompt.md",
          "logic-1.x.json",
        ],
      }),
    ).toBe(1);
  });
});
