import { describe, expect, test } from "bun:test";

import { branchLines } from "../branch-lines";

describe("branchLines", () => {
  test("上の区間との隙間には、親のまとまりの型に合う長さの線を通す", () => {
    const place = { target: "item", isLast: false } as const;

    expect(branchLines({ ...place, parent: "group" }).gap).toBe(
      "gapUnderGroup",
    );
    expect(branchLines({ ...place, parent: "repeat" }).gap).toBe(
      "gapUnderRepeat",
    );
  });

  test("後に子が続く区間は、親の列を下まで通し、その上に、つなぐ先への枝を重ねる", () => {
    const place = { parent: "repeat", isLast: false } as const;

    expect(branchLines({ ...place, target: "item" }).beside).toEqual([
      "through",
      "elbowToItem",
    ]);
    expect(branchLines({ ...place, target: "add" }).beside).toEqual([
      "through",
      "elbowToAdd",
    ]);
  });

  test("最後の子の区間は、枝で止め、親の列を下へ通さない", () => {
    const place = { parent: "repeat", isLast: true } as const;

    expect(branchLines({ ...place, target: "item" }).beside).toEqual([
      "elbowToItem",
    ]);
    expect(branchLines({ ...place, target: "add" }).beside).toEqual([
      "elbowToAdd",
    ]);
  });

  test("見出しへの枝は、まとまりの印が引くので、区間には重ねない", () => {
    const place = { parent: "group", target: "heading" } as const;

    expect(branchLines({ ...place, isLast: false }).beside).toEqual([
      "through",
    ]);
    expect(branchLines({ ...place, isLast: true }).beside).toEqual([]);
  });

  test("つなぐ先の無い区間は、最後でも、親の列を下まで通す", () => {
    expect(
      branchLines({ parent: "group", target: undefined, isLast: true }).beside,
    ).toEqual(["through"]);
  });
});
