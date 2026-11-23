import { expect, test } from "bun:test";

import { toKindChanges } from "@/features/kinds/push/to-kind-changes";

test("送った順のまま、作った・書き換えた・変わらない種類を分けること", () => {
  expect(
    toKindChanges({
      names: ["colophon", "about", "now"],
      created: new Set(["now"]),
      updated: new Set(["about"]),
    }),
  ).toEqual([
    { name: "colophon", change: "unchanged" },
    { name: "about", change: "updated" },
    { name: "now", change: "created" },
  ]);
});
