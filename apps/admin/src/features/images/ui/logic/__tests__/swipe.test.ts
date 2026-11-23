import { describe, expect, test } from "bun:test";

import { isTap, toSwipe } from "../swipe";

describe("toSwipe", () => {
  test("右へのスワイプは前の画像、左へのスワイプは次の画像にする", () => {
    expect(toSwipe({ dx: 120, dy: 10, duration: 200 })).toBe("previous");
    expect(toSwipe({ dx: -120, dy: -10, duration: 200 })).toBe("next");
  });

  test("横に48px、縦の1.5倍、0.8秒を境にスワイプを区別する", () => {
    expect(toSwipe({ dx: 48, dy: 32, duration: 800 })).toBe("previous");
    expect(toSwipe({ dx: 47, dy: 0, duration: 800 })).toBeUndefined();
    expect(toSwipe({ dx: 48, dy: 33, duration: 800 })).toBeUndefined();
    expect(toSwipe({ dx: 48, dy: 32, duration: 801 })).toBeUndefined();
  });

  test("短い動き・縦の動き・ゆっくりした動きは、スワイプと見なさない", () => {
    expect(toSwipe({ dx: 30, dy: 0, duration: 100 })).toBeUndefined();
    expect(toSwipe({ dx: 80, dy: 70, duration: 200 })).toBeUndefined();
    expect(toSwipe({ dx: -200, dy: 0, duration: 1200 })).toBeUndefined();
  });
});

describe("isTap", () => {
  test("10px 以内を、0.5秒より短く触れたときだけ、タップと見なす", () => {
    expect(isTap({ dx: 6, dy: 8, duration: 499 })).toBe(true);
    expect(isTap({ dx: 6, dy: 9, duration: 100 })).toBe(false);
    expect(isTap({ dx: 0, dy: 0, duration: 500 })).toBe(false);
  });
});
