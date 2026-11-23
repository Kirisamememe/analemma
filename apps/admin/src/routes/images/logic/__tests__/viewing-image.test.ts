import { expect, test } from "bun:test";

import { isViewingImage } from "../viewing-image";

const ID = "019b0000-0000-7000-8000-00000000000a";

test("大文字や末尾の / が違っても、同じ画像の画面と見なす", () => {
  expect(isViewingImage(`/images/${ID.toUpperCase()}/`, ID)).toBe(true);
  expect(isViewingImage(`/images/${ID}`, ID)).toBe(true);
});

test("一覧や別の画像の画面は、その画像の画面と見なさない", () => {
  expect(isViewingImage("/images", ID)).toBe(false);
  expect(isViewingImage(`/images/${ID}0`, ID)).toBe(false);
});
