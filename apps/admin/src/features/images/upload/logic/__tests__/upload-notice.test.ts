import { describe, expect, test } from "bun:test";

import type {
  PhotoUpload,
  UploadStatus,
} from "@/features/images/upload/logic/photo-uploads";
import { uploadNotice } from "@/features/images/upload/logic/upload-notice";

const uploads = (...statuses: UploadStatus[]): PhotoUpload[] =>
  statuses.map((status, index) => ({
    id: index + 1,
    file: new File(["x"], `${String(index + 1)}.jpg`),
    status,
  }));

describe("写真の転送と登録の全体の知らせ", () => {
  test("写真が無ければ、知らせを出さないこと", () => {
    expect(uploadNotice([])).toBeUndefined();
  });

  test("送っている間は進み具合を、すべて足せたら完了を、見出しにすること", () => {
    expect(uploadNotice(uploads("added", "sending", "waiting"))).toMatchObject({
      tone: "info",
      key: "imageUpload.notice.sending",
      counts: { added: 1, total: 3, failed: 0 },
      details: [],
    });
    expect(uploadNotice(uploads("added", "added"))).toMatchObject({
      tone: "success",
      key: "imageUpload.notice.done",
      details: [],
    });
  });

  test("変換中の写真は完了に数えず、閉じても変換が続くことを補足に出すこと", () => {
    expect(
      uploadNotice(uploads("added", "converting", "converting")),
    ).toMatchObject({
      tone: "info",
      key: "imageUpload.notice.sending",
      counts: { added: 1, total: 3, failed: 0 },
      details: [{ key: "imageUpload.notice.converting", count: 2 }],
    });
  });

  test("追加できなかった写真は、次にできることごとに枚数を補足に出すこと", () => {
    expect(
      uploadNotice(
        uploads(
          "added",
          "unreadable",
          "interrupted",
          "failed",
          "too-large",
          "unsupported",
        ),
      ),
    ).toMatchObject({
      tone: "warning",
      key: "imageUpload.notice.failed",
      counts: { added: 1, total: 6, failed: 5 },
      details: [
        { key: "imageUpload.notice.unreadable", count: 1 },
        { key: "imageUpload.notice.retryable", count: 2 },
        { key: "imageUpload.notice.rejected", count: 2 },
      ],
    });
    expect(uploadNotice(uploads("failed", "unreadable"))).toMatchObject({
      tone: "danger",
      key: "imageUpload.notice.allFailed",
    });
  });
});
