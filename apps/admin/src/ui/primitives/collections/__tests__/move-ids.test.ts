import { describe, expect, test } from "bun:test";

import { moveIds } from "@/ui/primitives/collections/move-ids";

const IDS = ["a", "b", "c", "d"];

describe("moveIds", () => {
  test("行を、基準の行の前か後に移す", () => {
    expect(
      moveIds(IDS, {
        keys: new Set(["a"]),
        target: { key: "c", dropPosition: "after" },
      }),
    ).toEqual(["b", "c", "a", "d"]);
    expect(
      moveIds(IDS, {
        keys: new Set(["d"]),
        target: { key: "a", dropPosition: "before" },
      }),
    ).toEqual(["d", "a", "b", "c"]);
  });

  test("複数の行は、元の順のまま移す", () => {
    expect(
      moveIds(IDS, {
        keys: new Set(["c", "a"]),
        target: { key: "d", dropPosition: "after" },
      }),
    ).toEqual(["b", "d", "a", "c"]);
  });

  test("並びが変わらない移し方は undefined を返す", () => {
    expect(
      moveIds(IDS, {
        keys: new Set(["b"]),
        target: { key: "c", dropPosition: "before" },
      }),
    ).toBeUndefined();
    expect(
      moveIds(IDS, {
        keys: new Set(["b"]),
        target: { key: "b", dropPosition: "after" },
      }),
    ).toBeUndefined();
  });

  test("行の上に落とすときと、無い行を基準にしたときは undefined を返す", () => {
    expect(
      moveIds(IDS, {
        keys: new Set(["a"]),
        target: { key: "c", dropPosition: "on" },
      }),
    ).toBeUndefined();
    expect(
      moveIds(IDS, {
        keys: new Set(["a"]),
        target: { key: "z", dropPosition: "after" },
      }),
    ).toBeUndefined();
    expect(
      moveIds(IDS, {
        keys: new Set(["z"]),
        target: { key: "a", dropPosition: "before" },
      }),
    ).toBeUndefined();
  });
});
