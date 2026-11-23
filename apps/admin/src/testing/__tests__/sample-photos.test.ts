import { describe, expect, test } from "bun:test";

import { samplePhoto } from "@/testing/sample-photos";

describe("samplePhoto", () => {
  test("長辺を 2560px にし、それより狭い段を幅の昇順に並べる", () => {
    expect(
      samplePhoto("dusk-ridge").map(({ width, height }) => [width, height]),
    ).toEqual([
      [640, 427],
      [1280, 853],
      [1920, 1280],
      [2560, 1707],
    ]);
    expect(samplePhoto("snow-path").map(({ width }) => width)).toEqual([
      640, 853,
    ]);
  });
});
