import { describe, expect, test } from "bun:test";

import {
  moveRepeatItem,
  removeRepeatItem,
  repeatFocusKey,
} from "../repeat-items";

const IDS = ["a", "b", "c"];

describe("moveRepeatItem", () => {
  test("動かした要素の、押した向きのボタンに focus を残す", () => {
    expect(moveRepeatItem(IDS, { id: "a", direction: 1 })).toEqual({
      ids: ["b", "a", "c"],
      focus: { id: "a", button: "down" },
    });
    expect(moveRepeatItem(IDS, { id: "c", direction: -1 })).toEqual({
      ids: ["a", "c", "b"],
      focus: { id: "c", button: "up" },
    });
  });

  test("端に着いたら、押したボタンは使えなくなるので、反対の向きのボタンへ移す", () => {
    expect(moveRepeatItem(IDS, { id: "b", direction: 1 })?.focus).toEqual({
      id: "b",
      button: "up",
    });
    expect(moveRepeatItem(IDS, { id: "b", direction: -1 })?.focus).toEqual({
      id: "b",
      button: "down",
    });
  });

  test("端より先や、無い要素は動かさない", () => {
    expect(moveRepeatItem(IDS, { id: "a", direction: -1 })).toBeUndefined();
    expect(moveRepeatItem(IDS, { id: "c", direction: 1 })).toBeUndefined();
    expect(moveRepeatItem(IDS, { id: "x", direction: 1 })).toBeUndefined();
  });
});

describe("removeRepeatItem", () => {
  test("次の要素の削除のボタンへ、末尾なら追加のボタンへ focus を移す", () => {
    expect(removeRepeatItem(IDS, "b")).toEqual({
      ids: ["a", "c"],
      focus: { id: "c", button: "remove" },
    });
    expect(removeRepeatItem(IDS, "c")).toEqual({
      ids: ["a", "b"],
      focus: "add",
    });
    expect(removeRepeatItem(IDS, "x")).toBeUndefined();
  });
});

test("focus を移すボタンを、要素とボタンごとに見分ける", () => {
  expect(repeatFocusKey({ id: "a", button: "up" })).not.toBe(
    repeatFocusKey({ id: "a", button: "down" }),
  );
  expect(repeatFocusKey("add")).toBe("add");
});
