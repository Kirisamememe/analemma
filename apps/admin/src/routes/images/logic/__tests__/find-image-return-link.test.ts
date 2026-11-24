import { expect, test } from "bun:test";

import { findImageReturnLink } from "../find-image-return-link";

const links = ["/images/7", "/images/5", "/images/3"].map((pathname) => ({
  pathname,
}));

test("同じ href のリンクがあれば、一覧の途中でもその写真に戻る", () => {
  expect(findImageReturnLink(links.toReversed(), "/images/5")).toBe(links[1]);
});

test("元の写真が無ければ、その href より前のリンクのうち一覧で最初に出る写真に戻る", () => {
  expect(findImageReturnLink(links, "/images/6")).toBe(links[1]);
});

test("元の href より前のリンクが無ければ最後の写真に戻り、一覧が空なら戻り先は無い", () => {
  expect(findImageReturnLink(links, "/images/1")).toBe(links.at(-1));
  const empty: typeof links = [];
  expect(findImageReturnLink(empty, "/images/1")).toBeUndefined();
});
