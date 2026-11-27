import { describe, expect, test } from "bun:test";

import {
  convertingIds,
  isConverted,
  settledSince,
} from "../conversion-results";

const page = (
  ...images: Parameters<typeof settledSince>[1][number]["images"]
) => [{ images }];

describe("settledSince", () => {
  test("前に変換中だった画像のうち、変換を終えたものだけを返す", () => {
    const before = convertingIds(
      page(
        { id: "a", status: "processing", title: "港" },
        { id: "b", status: "processing", title: null },
        { id: "c", status: "published", title: "湖" },
      ),
    );

    expect([...before]).toEqual(["a", "b"]);
    expect(
      settledSince(
        before,
        page(
          { id: "a", status: "unpublished", title: "港" },
          { id: "b", status: "processing", title: null },
          { id: "c", status: "published", title: "湖" },
        ),
      ),
    ).toEqual([{ id: "a", status: "unpublished", title: "港" }]);
  });

  test("一覧から消えた画像は返さない", () => {
    const before = convertingIds(
      page({ id: "a", status: "processing", title: "港" }),
    );

    expect(settledSince(before, page())).toEqual([]);
  });
});

describe("isConverted", () => {
  test.each([
    ["published", true],
    ["unpublished", true],
    ["unreadable", false],
    ["interrupted", false],
  ] as const)("%s は %p", (status, expected) => {
    expect(isConverted({ status })).toBe(expected);
  });
});
