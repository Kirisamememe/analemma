import { describe, expect, test } from "bun:test";

describe.skip("飛ばすテスト", () => {
  test.only("1であること", () => {
    expect(1).toBe(1);
  });

  test.if(false)("2であること", () => {
    expect(2).toBe(2);
  });
});
