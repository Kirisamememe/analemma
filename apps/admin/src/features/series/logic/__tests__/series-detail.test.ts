import { expect, test } from "bun:test";

import {
  seriesChangeResult,
  seriesDetailReducer,
  seriesPendingOrder,
} from "../series-detail";

test("公開・非公開・削除はシリーズ名を付けた完了の知らせを選び、削除だけが一覧へ戻る", () => {
  for (const [action, message] of [
    ["publish", "fixedPages.publishDone"],
    ["unpublish", "fixedPages.unpublishDone"],
    ["delete", "fixedPages.deleted"],
  ] as const) {
    expect(seriesChangeResult({ action }, undefined)).toMatchObject({
      kind: "changed",
      message,
      deleted: action === "delete",
      focusAdd: false,
    });
    expect(seriesChangeResult({ action }, "NOT_FOUND")).toMatchObject({
      kind: "failed",
      message: "series.imageGone",
    });
  }
});

test("送った並びを表示し、後の並べ直しが始まったら前の応答では並びを戻さない", () => {
  const first = { action: "reorder", imageIds: ["b", "a", "c"] } as const;
  const second = { action: "reorder", imageIds: ["c", "a", "b"] } as const;
  const initial = seriesDetailReducer({}, { type: "sent", change: first });

  const current = seriesDetailReducer(initial, {
    type: "sent",
    change: second,
  });

  const late = seriesDetailReducer(current, {
    type: "changed",
    change: first,
    focusAdd: false,
  });

  expect(seriesPendingOrder(late.pending)).toEqual(second.imageIds);
  expect(seriesChangeResult(second, "ORDER_MISMATCH")).toMatchObject({
    kind: "failed",
    message: "series.orderMismatch",
  });
  expect(
    seriesPendingOrder(
      seriesDetailReducer(late, { type: "failed", change: second }).pending,
    ),
  ).toBeUndefined();
});

test("追加に失敗した画像を調べる間は Dialog を保ち、追加・取り外しが済んだら追加のボタンに戻る", () => {
  const add = { action: "addImages", imageIds: ["a", "b"] } as const;
  const open = seriesDetailReducer({}, { type: "dialog", dialog: "picker" });
  const sending = seriesDetailReducer(open, { type: "sent", change: add });
  expect(seriesChangeResult(add, "NOT_FOUND")).toEqual({
    kind: "checkImages",
    imageIds: add.imageIds,
  });
  expect(
    seriesDetailReducer(sending, {
      type: "failed",
      change: add,
      missing: new Set(["a"]),
    }),
  ).toMatchObject({ dialog: "picker", missing: new Set(["a"]) });

  for (const action of ["addImages", "removeImages"] as const) {
    expect(
      seriesChangeResult({ action, imageIds: ["b"] }, undefined),
    ).toMatchObject({ kind: "changed", focusAdd: true });
  }

  const done = seriesDetailReducer(sending, {
    type: "changed",
    change: add,
    focusAdd: true,
  });

  expect(done.dialog).toBeUndefined();
  expect(done.focusAdd).toBe(true);
  expect(seriesDetailReducer(done, { type: "focused" }).focusAdd).toBe(false);
});
