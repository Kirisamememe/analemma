import { expect, test } from "bun:test";

import { coversAllPages } from "@/features/fixed-pages/ordering/covers-all-pages";

test.each([
  {
    title: "すべてのページを1回ずつ含む並び",
    requested: ["b", "a"],
    covers: true,
  },
  { title: "足りない並び", requested: ["a"], covers: false },
  {
    title: "知らない ID を含む並び",
    requested: ["a", "b", "c"],
    covers: false,
  },
  { title: "同じ ID を2回含む並び", requested: ["a", "a"], covers: false },
  { title: "数は合うが、1つが違う並び", requested: ["a", "c"], covers: false },
  { title: "大文字で書いた ID の並び", requested: ["B", "A"], covers: true },
  {
    title: "大文字と小文字で同じ ID を2回含む並び",
    requested: ["a", "A"],
    covers: false,
  },
])(
  "$title を、すべてのページを含むかで見分けること",
  ({ covers, requested }) => {
    expect(coversAllPages({ existing: ["a", "b"], requested })).toBe(covers);
  },
);
