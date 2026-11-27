import { describe, expect, test } from "bun:test";

import {
  clearFinished,
  deferUpload,
  hasUnsentPhotos,
  retryUpload,
  withAdded,
  isUploading,
  nextUploads,
  queuePhotos,
  withStatus,
} from "@/features/images/upload/logic/photo-uploads";

const file = (name: string, size: number): File =>
  new File([new Uint8Array(size)], name);

type Uploads = ReturnType<typeof queuePhotos>;

const defer = (current: Uploads, times: number): Uploads =>
  times === 0 ? current : defer(deferUpload(1)(current), times - 1);

const statuses = (current: Uploads): string[] =>
  current.map(({ status }) => status);

describe("送る写真の一覧", () => {
  test("選んだ順に後ろへ足し、上限を超える写真は大きすぎる、空のファイルは対応していない形式として送らないこと", () => {
    const first = queuePhotos([], { files: [file("a.jpg", 10)], maxBytes: 10 });

    const uploads = queuePhotos(first, {
      files: [file("b.heic", 11), file("c.png", 1), file("d.jpg", 0)],
      maxBytes: 10,
    });

    expect(
      uploads.map(({ id, file: { name }, status }) => [id, name, status]),
    ).toEqual([
      [1, "a.jpg", "waiting"],
      [2, "b.heic", "too-large"],
      [3, "c.png", "waiting"],
      [4, "d.jpg", "unsupported"],
    ]);
  });

  test("空いた枠に合わせ、待機中の写真を選択順に2枚まで返すこと", () => {
    const uploads = queuePhotos([], {
      files: [file("a.jpg", 1), file("b.jpg", 1), file("c.jpg", 1)],
      maxBytes: 10,
    });

    const firstSending = withStatus(1, "sending")(uploads);
    const bothSending = withStatus(2, "sending")(firstSending);

    expect(nextUploads(uploads).map(({ id }) => id)).toEqual([1, 2]);
    expect(nextUploads(firstSending).map(({ id }) => id)).toEqual([2]);
    expect(nextUploads(bothSending)).toEqual([]);
    expect(
      nextUploads(withStatus(2, "added")(bothSending)).map(({ id }) => id),
    ).toEqual([3]);
  });

  test("上限を1枚に絞ると、送信中の写真があるあいだは次を返さないこと", () => {
    const uploads = queuePhotos([], {
      files: [file("a.jpg", 1), file("b.jpg", 1)],
      maxBytes: 10,
    });

    expect(nextUploads(uploads, 1).map(({ id }) => id)).toEqual([1]);
    expect(nextUploads(withStatus(1, "sending")(uploads), 1)).toEqual([]);
  });

  test("受付が埋まっていた写真を待機に戻し、12回続いたら送れなかったことにすること", () => {
    const uploads = withStatus(
      1,
      "sending",
    )(
      queuePhotos([], {
        files: [file("a.jpg", 1), file("b.jpg", 1)],
        maxBytes: 10,
      }),
    );

    expect(statuses(defer(uploads, 1))).toEqual(["waiting", "waiting"]);
    expect(statuses(defer(uploads, 11))).toEqual(["waiting", "waiting"]);
    expect(statuses(defer(uploads, 12))).toEqual(["failed", "waiting"]);
    expect(statuses(defer(retryUpload(1)(defer(uploads, 12)), 11))).toEqual([
      "waiting",
      "waiting",
    ]);
  });

  test("待っているか送っている写真があるあいだだけ、送り終えていないとすること", () => {
    const uploads = queuePhotos([], {
      files: [file("a.jpg", 1)],
      maxBytes: 10,
    });

    expect(isUploading(uploads)).toBe(true);
    expect(isUploading(withStatus(1, "sending")(uploads))).toBe(true);
    expect(isUploading(withStatus(1, "failed")(uploads))).toBe(false);
  });

  test("結果を閉じると、送り終えた写真を外し、まだ送っていない写真を残すこと", () => {
    const uploads = [
      withStatus(1, "added"),
      withStatus(2, "unsupported"),
      withStatus(3, "sending"),
    ].reduce(
      (current, change) => change(current),
      queuePhotos([], {
        files: [
          file("a.jpg", 1),
          file("b.bmp", 1),
          file("c.jpg", 1),
          file("d.jpg", 1),
        ],
        maxBytes: 10,
      }),
    );

    expect(clearFinished(uploads).map(({ id }) => id)).toEqual([3, 4]);
  });

  test("結果を閉じた後に足した写真にも、前と重ならない番号を振ること", () => {
    const sending = withStatus(
      2,
      "sending",
    )(
      queuePhotos([], {
        files: [file("a.jpg", 1), file("b.jpg", 1)],
        maxBytes: 10,
      }),
    );

    const uploads = queuePhotos(
      clearFinished(withStatus(1, "added")(sending)),
      { files: [file("c.jpg", 1)], maxBytes: 10 },
    );

    expect(uploads.map(({ id }) => id)).toEqual([2, 3]);
  });
});

describe("足せた写真と送り直し", () => {
  test("足せた写真に画像の ID を持たせ、送れなかった写真だけを送り直す写真として待たせること", () => {
    const uploads = [
      withAdded(1, {
        id: "019b0000-0000-7000-8000-000000000001",
        deliveryImages: [{ width: 640, height: 480, url: "/media/photo.avif" }],
      }),
      withStatus(2, "failed"),
      withStatus(3, "unsupported"),
    ].reduce(
      (current, change) => change(current),
      queuePhotos([], {
        files: [file("a.jpg", 1), file("b.jpg", 1), file("c.bmp", 1)],
        maxBytes: 10,
      }),
    );

    expect(uploads[0]).toMatchObject({
      status: "added",
      imageId: "019b0000-0000-7000-8000-000000000001",
      previewUrl: "/media/photo.avif",
    });
    expect(hasUnsentPhotos(uploads)).toBe(true);

    const retried = retryUpload(3)(retryUpload(2)(uploads));

    expect(
      retried.map(({ status, retried: again }) => [status, again === true]),
    ).toEqual([
      ["added", false],
      ["waiting", true],
      ["unsupported", false],
    ]);
    expect(hasUnsentPhotos(withStatus(2, "added")(retried))).toBe(false);
  });
});
