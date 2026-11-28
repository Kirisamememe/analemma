import { describe, expect, test } from "bun:test";

import { imagePageKey, lastPageIndex } from "../image-pages";

const page = (...ids: string[]) => ({ images: ids.map((id) => ({ id })) });

describe("lastPageIndex", () => {
  test("続きがある間は、最後のページを決めない", () => {
    expect(lastPageIndex([page("3"), page("2")], true)).toBeUndefined();
  });

  test("続きが無ければ、読んだ最後のページの番号を返す", () => {
    expect(lastPageIndex([page("3"), page("2")], false)).toBe(1);
  });

  test("続きがあると返っても、最後に読んだページが空なら、そのページを最後とする", () => {
    expect(lastPageIndex([page("3"), page()], true)).toBe(1);
  });
});

describe("imagePageKey", () => {
  test("最初のページは、先頭の画像が替わっても同じ key にする", () => {
    expect(imagePageKey(page("9").images, 0)).toBe("first");
    expect(imagePageKey(page("10", "9").images, 0)).toBe("first");
  });

  test("続きのページは、先頭の画像の ID を key にする", () => {
    expect(imagePageKey(page("5", "4").images, 1)).toBe("5");
  });
});
