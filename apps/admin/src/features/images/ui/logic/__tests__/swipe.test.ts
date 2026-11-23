import { describe, expect, test } from "bun:test";

import { toSwipe } from "../swipe";

describe("toSwipe", () => {
  test("右へのスワイプは前の画像、左へのスワイプは次の画像にする", () => {
    expect(toSwipe({ dx: 120, dy: 10, duration: 200 })).toBe("previous");
    expect(toSwipe({ dx: -120, dy: -10, duration: 200 })).toBe("next");
  });

  test("短い動き・縦の動き・ゆっくりした動きは、スワイプと見なさない", () => {
    expect(toSwipe({ dx: 30, dy: 0, duration: 100 })).toBeUndefined();
    expect(toSwipe({ dx: 80, dy: 70, duration: 200 })).toBeUndefined();
    expect(toSwipe({ dx: -200, dy: 0, duration: 1200 })).toBeUndefined();
  });
});
