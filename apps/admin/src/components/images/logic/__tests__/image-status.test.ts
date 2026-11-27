import { expect, test } from "bun:test";

import { toImageStatusView } from "../image-status";

test("変換中の画像には、待っていることを伝えるバッジと文言を出す", () => {
  expect(toImageStatusView("processing")).toEqual({
    badge: "images.converting",
    tone: "info",
    missing: "images.convertingImage",
    detail: "images.convertingImage",
    isPending: true,
  });
});

test("変換できなかった画像には、同じバッジと、理由ごとの文言を出す", () => {
  const unreadable = toImageStatusView("unreadable");
  const interrupted = toImageStatusView("interrupted");

  expect([unreadable.badge, interrupted.badge]).toEqual([
    "images.conversionFailed",
    "images.conversionFailed",
  ]);
  expect([unreadable.tone, interrupted.tone]).toEqual(["danger", "danger"]);
  expect([unreadable.missing, unreadable.detail]).toEqual([
    "images.unreadable",
    "images.unreadableDetail",
  ]);
  expect([interrupted.missing, interrupted.detail]).toEqual([
    "images.interrupted",
    "images.interruptedDetail",
  ]);
});

test("公開の画像にはバッジを出さず、非公開の画像には非公開のバッジを出す", () => {
  expect(toImageStatusView("published").badge).toBeUndefined();
  expect(toImageStatusView("unpublished")).toMatchObject({
    badge: "images.unpublished",
    tone: "neutral",
    isPending: false,
  });
});
