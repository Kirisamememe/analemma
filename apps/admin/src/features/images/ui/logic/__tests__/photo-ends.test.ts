import { expect, test } from "bun:test";

import { photoEnds } from "../photo-ends";

test("配信用の画像が無ければ、何も返さない", () => {
  expect(photoEnds([])).toBeUndefined();
});

test("幅の昇順に並んだ画像の、先頭を最小、末尾を最大として返す", () => {
  expect(photoEnds([320, 640, 1280])).toEqual({ smallest: 320, largest: 1280 });
});

test("1枚だけなら、その画像を最小と最大の両方に返す", () => {
  expect(photoEnds([640])).toEqual({ smallest: 640, largest: 640 });
});
