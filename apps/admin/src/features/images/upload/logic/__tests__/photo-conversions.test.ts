import { describe, expect, test } from "bun:test";

import {
  isReplacing,
  nextConverting,
  withAdded,
  withConverted,
  withRetryStarted,
} from "@/features/images/upload/logic/photo-conversions";
import {
  countDiscarded,
  hasUnsentPhotos,
  isUploading,
  queuePhotos,
  retryUpload,
} from "@/features/images/upload/logic/photo-uploads";

const file = (name: string, size: number): File =>
  new File([new Uint8Array(size)], name);

const statuses = (current: ReturnType<typeof queuePhotos>): string[] =>
  current.map(({ status }) => status);

const received = (id: number, status: "processing" | "published") =>
  withAdded(id, {
    id: `019b0000-0000-7000-8000-00000000000${String(id)}`,
    status,
    deliveryImages:
      status === "published"
        ? [{ width: 640, height: 480, url: "/media/photo.avif" }]
        : [],
  });

describe("受け取られた写真の変換", () => {
  const queued = queuePhotos([], {
    files: [file("a.jpg", 1), file("b.jpg", 1), file("c.jpg", 1)],
    maxBytes: 10,
  });

  test("受け取られた写真は、画像が変換中なら変換中に、変換を終えていれば足せた写真にすること", () => {
    const uploads = received(2, "published")(received(1, "processing")(queued));

    expect(statuses(uploads)).toEqual(["converting", "added", "waiting"]);
    expect(uploads[0]?.previewUrl).toBeUndefined();
    expect(uploads[1]?.previewUrl).toBe("/media/photo.avif");
  });

  test("変換の結果を待つ写真のうち、いちばん先に受け取られた写真を選ぶこと", () => {
    const uploads = received(
      1,
      "processing",
    )(received(3, "processing")(received(2, "published")(queued)));

    expect(nextConverting(uploads)?.id).toBe(1);
    expect(nextConverting(queued)).toBeUndefined();
  });

  test("変換を終えられなかった写真は、画像の ID を外して送り直せ、読めなかった写真は送り直せないこと", () => {
    const failed = [
      withAdded(1, {
        id: "019b0000-0000-7000-8000-000000000001",
        status: "interrupted",
        deliveryImages: [],
      }),
      withAdded(2, {
        id: "019b0000-0000-7000-8000-000000000002",
        status: "unreadable",
        deliveryImages: [],
      }),
    ].reduce((current, change) => change(current), queued);

    const retried = retryUpload(2)(retryUpload(1)(failed));

    expect(statuses(retried)).toEqual(["waiting", "unreadable", "waiting"]);
    expect(retried[0]).toMatchObject({ retried: true, imageId: undefined });
    expect(hasUnsentPhotos(failed.slice(0, 2))).toBe(true);
    expect(hasUnsentPhotos(failed.slice(1, 2))).toBe(false);
  });

  test("取り直した結果は、同じ画像を今も待っている写真にだけ当て、無くなった画像は送り直せる状態にすること", () => {
    const waiting = received(1, "processing")(queued);
    const imageId = waiting[0]?.imageId ?? "";

    const converted = withConverted({
      id: 1,
      imageId,
      image: {
        status: "published",
        deliveryImages: [{ width: 640, height: 480, url: "/media/a.avif" }],
      },
    })(waiting);

    expect(converted[0]).toMatchObject({
      status: "added",
      imageId,
      previewUrl: "/media/a.avif",
    });
    expect(
      withConverted({ id: 1, imageId, image: undefined })(waiting)[0],
    ).toMatchObject({ status: "interrupted", imageId: undefined });

    const other = { id: 1, imageId: "019b0000-0000-7000-8000-0000000000ff" };

    expect(
      withConverted({
        ...other,
        image: { status: "published", deliveryImages: [] },
      })(waiting),
    ).toEqual(waiting);
    expect(
      withConverted({ id: 1, imageId, image: undefined })(converted),
    ).toEqual(converted);
  });

  test("送り直しの準備を始めた写真は、前の画像を消している状態にして完了を止め、取りやめたら押せる状態に戻すこと", () => {
    const imageId = "019b0000-0000-7000-8000-000000000001";

    const interrupted = withAdded(1, {
      id: imageId,
      status: "interrupted",
      deliveryImages: [],
    })(queued);

    const started = withRetryStarted(1, true)(interrupted);

    expect(started[0]?.status).toBe("replacing");
    expect(isUploading(started.slice(0, 1))).toBe(true);
    expect(isReplacing(started, { id: 1, imageId })).toBe(true);
    expect(withRetryStarted(1, false)(started)[0]?.status).toBe("interrupted");
    expect(withRetryStarted(2, true)(interrupted)).toEqual(interrupted);
  });

  test("前の画像を消している間に一覧から外れた写真と、同じ番号の別の写真は、消している写真としないこと", () => {
    const imageId = "019b0000-0000-7000-8000-000000000001";
    const other = queuePhotos([], { files: [file("d.jpg", 1)], maxBytes: 10 });

    const replacing = withRetryStarted(
      1,
      true,
    )(
      withAdded(1, {
        id: "019b0000-0000-7000-8000-000000000009",
        status: "interrupted",
        deliveryImages: [],
      })(other),
    );

    expect(replacing[0]?.status).toBe("replacing");
    expect(isReplacing(replacing, { id: 1, imageId })).toBe(false);
    expect(isReplacing(other, { id: 1, imageId })).toBe(false);
    expect(
      isReplacing(received(1, "processing")(other), { id: 1, imageId }),
    ).toBe(false);
  });

  test("変換中の写真は、追加できなかった写真に数えず、変換を終えられなかった写真は数えること", () => {
    const converting = received(1, "processing")(queued).slice(0, 1);

    const interrupted = withAdded(1, {
      id: "019b0000-0000-7000-8000-000000000001",
      status: "interrupted",
      deliveryImages: [],
    })(queued).slice(0, 1);

    expect(countDiscarded(converting, () => true)).toBe(0);
    expect(countDiscarded(interrupted, () => false)).toBe(1);
  });
});
