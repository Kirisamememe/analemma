import { describe, expect, test } from "bun:test";

import {
  type PhotoUpload,
  queuePhotos,
  withAdded,
  withStatus,
} from "@/features/images/upload/logic/photo-uploads";
import {
  countUploads,
  focusAfterRetry,
  formatFileSize,
  retryAction,
  summaryKind,
  toProgressTone,
} from "@/features/images/upload/logic/upload-view";

const file = (name: string, size: number): File =>
  new File([new Uint8Array(size)], name);

const queued = (count: number): readonly PhotoUpload[] =>
  queuePhotos([], {
    files: Array.from({ length: count }, (_, index) =>
      file(`${String(index)}.jpg`, 1),
    ),
    maxBytes: 10,
  });

describe("送る写真の一覧の見せ方", () => {
  test("足せた数と足せなかった数を数え、送っている間・送り終えた・足せなかった写真がある、を分けること", () => {
    const uploads = withStatus(
      2,
      "unsupported",
    )(withAdded(1, "019b0000-0000-7000-8000-000000000001")(queued(3)));

    expect(countUploads(uploads)).toEqual({ added: 1, failed: 1, total: 3 });
    expect(summaryKind([])).toBe("none");
    expect(summaryKind(uploads)).toBe("progress");
    expect(summaryKind(withStatus(3, "added")(uploads))).toBe(
      "done-with-failures",
    );
    expect(
      summaryKind(withStatus(2, "added")(withStatus(3, "added")(uploads))),
    ).toBe("done");
  });

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

  test("送り直しが済んだら、足せた写真は結果へ、ほかは追加のボタンへ focus を引き継ぐこと", () => {
    expect(focusAfterRetry({ status: "sending" })).toBeUndefined();
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
