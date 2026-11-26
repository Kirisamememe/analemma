import { describe, expect, test } from "bun:test";

import { toSrcSet, toTileAspect, toTileSizes } from "../delivery-image";

const sizes = (width: number, height: number) => [
  {
    width: 640,
    height: Math.round((640 * height) / width),
    url: "/a/640.avif",
  },
  { width, height, url: `/a/${String(width)}.avif` },
];

describe("toTileAspect", () => {
  test("いちばん大きい配信用の画像の縦横比にする", () => {
    expect(toTileAspect(sizes(2560, 1707))).toBeCloseTo(1.5, 2);
    expect(toTileAspect(sizes(1707, 2560))).toBeCloseTo(0.667, 2);
  });

  test("極端な縦長と横長は、1:2 と 5:2 に収める", () => {
    expect(toTileAspect(sizes(800, 2560))).toBe(0.5);
    expect(toTileAspect(sizes(2560, 640))).toBe(2.5);
  });

  test("配信用の画像が無ければ、3:2 の枠にする", () => {
    expect(toTileAspect([])).toBe(1.5);
  });
});

describe("toSrcSet", () => {
  test("幅の記述子を付けて、幅の昇順に並べる", () => {
    expect(toSrcSet(sizes(1280, 853))).toBe(
      "/a/640.avif 640w, /a/1280.avif 1280w",
    );
    expect(toSrcSet([])).toBe("");
  });
});

describe("toTileSizes", () => {
  test("行の高さと縦横比から、広い画面と狭い画面の幅の見込みを出す", () => {
    expect(toTileSizes(1.5)).toBe(
      "(min-width: 31rem) 19.8rem, min(100vw, 21.0rem)",
    );
    expect(toTileSizes(0.5)).toBe(
      "(min-width: 31rem) 6.6rem, min(100vw, 7.0rem)",
    );
  });
});
