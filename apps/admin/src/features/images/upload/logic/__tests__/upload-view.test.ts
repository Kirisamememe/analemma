import { describe, expect, test } from "bun:test";

import {
  focusAfterRetry,
  formatFileSize,
  retryAction,
  toProgressTone,
  toStatusLabel,
} from "@/features/images/upload/logic/upload-view";

describe("送る写真の一覧の見せ方", () => {
  test("状態ごとの見せ方を決めること", () => {
    expect(
      (["waiting", "sending", "added", "failed"] as const).map((status) =>
        toProgressTone(status),
      ),
    ).toEqual(["neutral", "info", "success", "danger"]);
  });

  test("送り直しは、送れなかった写真で押せ、送り直している間は送信中にし、ほかでは出さないこと", () => {
    expect(retryAction({ status: "failed" })).toBe("ready");
    expect(retryAction({ status: "sending", retried: true })).toBe("pending");
    expect(retryAction({ status: "unsupported", retried: true })).toBe("none");
    expect(retryAction({ status: "sending" })).toBe("none");
  });

  test("変換中は進んでいる見せ方に、変換できなかった写真は失敗の見せ方にし、server の都合の失敗だけ送り直せること", () => {
    expect(
      (["converting", "unreadable", "interrupted"] as const).map((status) =>
        toProgressTone(status),
      ),
    ).toEqual(["info", "danger", "danger"]);
    expect(retryAction({ status: "interrupted" })).toBe("ready");
    expect(retryAction({ status: "interrupted", retried: true })).toBe("ready");
    expect(retryAction({ status: "replacing" })).toBe("pending");
    expect(toProgressTone("replacing")).toBe("neutral");
    expect(toStatusLabel("replacing")).toBe("imageUpload.status.waiting");
    expect(toStatusLabel("interrupted")).toBe("imageUpload.status.interrupted");
    expect(toStatusLabel("unreadable")).toBe("imageUpload.status.unreadable");
    expect(toStatusLabel("converting")).toBe("imageUpload.status.converting");
    expect(retryAction({ status: "unreadable" })).toBe("none");
    expect(retryAction({ status: "converting" })).toBe("none");
  });

  test("送り直しが済んだら、足せた写真は結果へ、ほかは追加のボタンへ focus を引き継ぐこと", () => {
    expect(focusAfterRetry({ status: "sending" })).toBeUndefined();
    expect(focusAfterRetry({ status: "replacing" })).toBeUndefined();
    expect(focusAfterRetry({ status: "added", imageId: "x" })).toBe("result");
    expect(focusAfterRetry({ status: "unsupported" })).toBe("add-button");
  });
});

describe("ファイルの大きさ", () => {
  test("1 MB に満たなければ KB に切り上げ、ほかは MB を小数1桁までにすること", () => {
    expect(formatFileSize("ja", 10)).toMatch(/^1 kB$/iv); // KB か kB かは ICU の版で変わる
    expect(formatFileSize("ja", 1536)).toMatch(/^2 kB$/iv);
    expect(formatFileSize("ja", 64 * 1024 * 1024)).toBe("64 MB");
    expect(formatFileSize("en", 4.25 * 1024 * 1024)).toBe("4.3 MB");
  });
});
