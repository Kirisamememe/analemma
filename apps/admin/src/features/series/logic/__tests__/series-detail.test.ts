import { expect, test } from "bun:test";

import { seriesChangeResult, seriesDetailReducer } from "../series-detail";

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
    });
    expect(seriesChangeResult({ action }, "NOT_FOUND")).toMatchObject({
      kind: "failed",
      message: "series.imageGone",
    });
  }
});

test("遅れて届いた前の応答では、今の削除の確認を閉じない", () => {
  const first = { action: "publish" } as const;
  const second = { action: "delete" } as const;
  const open = seriesDetailReducer({}, { type: "dialog", dialog: "delete" });
  const pending = seriesDetailReducer(open, { type: "sent", change: second });
  expect(seriesDetailReducer(pending, { type: "changed", change: first })).toBe(
    pending,
  );
  expect(
    seriesDetailReducer(pending, { type: "failed", change: second }).dialog,
  ).toBe("delete");
  expect(
    seriesDetailReducer(pending, { type: "changed", change: second }).dialog,
  ).toBeUndefined();
});
