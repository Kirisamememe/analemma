import { describe, expect, test } from "bun:test";

import { keepNeighborLinks, viewerProgress } from "../viewer-progress";

const progress = (
  overrides: Partial<Parameters<typeof viewerProgress>[0]> = {},
) =>
  viewerProgress({
    id: "b",
    shownId: "b",
    status: "Loaded",
    hasNeighbors: true,
    ...overrides,
  });

describe("viewerProgress", () => {
  test("写真・情報・前後がそろうと、前後へ移れ、待つものが無い", () => {
    expect(progress()).toEqual({
      canMove: true,
      ready: true,
      waiting: undefined,
    });
  });

  test("待っているものを、写真・情報・前後の順に伝える", () => {
    expect(progress({ id: "c" }).waiting).toBe("imageViewer.loading");
    expect(progress({ status: "Loading" }).waiting).toBe(
      "imageDetail.loadingInfo",
    );
    expect(progress({ hasNeighbors: false }).waiting).toBe(
      "imageDetail.loadingNeighbors",
    );
  });

  test("待つ間は前後へ移れず、focus を戻さない", () => {
    expect(progress({ id: "c" })).toMatchObject({
      canMove: false,
      ready: false,
    });
    expect(progress({ hasNeighbors: false })).toMatchObject({
      canMove: false,
      ready: false,
    });
  });

  test("取得に失敗したら、待っているとは伝えず、focus を戻せる", () => {
    expect(progress({ id: "c", status: "Failed" })).toEqual({
      canMove: false,
      ready: true,
      waiting: undefined,
    });
  });

  test("表示する写真が無ければ、取得を終えた時点で focus を戻せる", () => {
    expect(progress({ shownId: undefined, status: "Loaded" }).ready).toBe(true);
    expect(progress({ shownId: undefined, status: "Loading" }).ready).toBe(
      false,
    );
  });
});

describe("keepNeighborLinks", () => {
  const last = { previous: "a", next: "c" };

  test("移れない間は、最後に移れた前後を残す", () => {
    expect(keepNeighborLinks(last, undefined)).toBe(last);
  });

  test("移れるときは今の前後に替え、同じなら前の値をそのまま返す", () => {
    expect(keepNeighborLinks(last, { previous: "b", next: "d" })).toEqual({
      previous: "b",
      next: "d",
    });
    expect(keepNeighborLinks(last, { previous: "a", next: "c" })).toBe(last);
  });
});
