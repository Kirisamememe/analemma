import type { UploadValue } from "../upload-value";

import type { ApiOutputs } from "@/api/api-types";

/** 送る写真1枚の状態。 */
export type UploadStatus =
  | "waiting"
  | "sending"
  | "added"
  | "too-large"
  | "unsupported"
  | "failed";

/** 管理画面から送る写真1枚。 */
export type PhotoUpload = {
  /** 一覧の中で写真を見分ける番号。 */
  readonly id: number;
  /** 選んだファイル。 */
  readonly file: File;
  /** 送る写真の状態。 */
  readonly status: UploadStatus;
  /** このファイルの送信済みの割合（%）。 */
  readonly progress?: UploadValue<number> | undefined;
  /** 足せたときの、画像の ID。 */
  readonly imageId?: string | undefined;
  /** 元の写真を表示できないときに使う配信用の URL。 */
  readonly previewUrl?: string | undefined;
  /** 送れなかった後に、送り直したか。 */
  readonly retried?: boolean | undefined;
  /** server の受付が埋まっていて、待たされた回数。 */
  readonly deferrals?: number | undefined;
};

/** 送る写真の一覧に足すファイルと、1枚の大きさの上限。 */
export type QueuedFiles = {
  /** 選んだファイル。 */
  readonly files: readonly File[];
  /** 1枚の大きさの上限(bytes)。 */
  readonly maxBytes: number;
};

/** 選んだファイルを、送る写真の一覧の後ろに足す。 */
export const queuePhotos = (
  uploads: readonly PhotoUpload[],
  { files, maxBytes }: QueuedFiles,
): readonly PhotoUpload[] => {
  const firstId = (uploads.at(-1)?.id ?? 0) + 1;

  return [
    ...uploads,
    ...files.map((file, index) => ({
      id: firstId + index,
      file,
      status:
        file.size === 0
          ? ("unsupported" as const)
          : file.size > maxBytes
            ? ("too-large" as const)
            : ("waiting" as const),
    })),
  ];
};

const MAX_DEFERRALS = 12; // 待ち時間と合わせて約2分。server が1枚の変換を待つ時間と同じ

/** 送信中の写真と合わせて上限まで、待機中の写真を選んだ順に返す。 */
export const nextUploads = (
  uploads: readonly PhotoUpload[],
  limit: number,
): readonly PhotoUpload[] => {
  const available =
    limit - uploads.filter(({ status }) => status === "sending").length;

  return uploads
    .filter(({ status }) => status === "waiting")
    .slice(0, Math.max(0, available));
};

/** 写真の状態を変える。 */
export const withStatus =
  (id: number, status: UploadStatus) =>
  (uploads: readonly PhotoUpload[]): readonly PhotoUpload[] =>
    uploads.map((upload) =>
      upload.id === id ? { ...upload, status, progress: undefined } : upload,
    );

/** 写真を足せたことにし、作った画像の ID を持たせる。 */
export const withAdded =
  (
    id: number,
    image: Pick<
      ApiOutputs["admin"]["images"]["upload"],
      "id" | "deliveryImages"
    >,
  ) =>
  (uploads: readonly PhotoUpload[]): readonly PhotoUpload[] =>
    uploads.map((upload) =>
      upload.id === id
        ? {
            ...upload,
            status: "added",
            progress: undefined,
            imageId: image.id,
            previewUrl: image.deliveryImages[0]?.url,
          }
        : upload,
    );

/** server の受付が埋まっていた写真の状態を変える。 */
export const deferUpload =
  (id: number) =>
  (uploads: readonly PhotoUpload[]): readonly PhotoUpload[] =>
    uploads.map((upload) => {
      if (upload.id !== id) return upload;

      const deferrals = (upload.deferrals ?? 0) + 1;

      return deferrals < MAX_DEFERRALS
        ? { ...upload, status: "waiting", progress: undefined, deferrals }
        : {
            ...upload,
            status: "failed",
            progress: undefined,
            deferrals: undefined,
          };
    });

/** 送れなかった写真を、送り直す写真として待たせる。 */
export const retryUpload =
  (id: number) =>
  (uploads: readonly PhotoUpload[]): readonly PhotoUpload[] =>
    uploads.map((upload) =>
      upload.id === id && upload.status === "failed"
        ? { ...upload, status: "waiting", retried: true, deferrals: undefined }
        : upload,
    );

/** 送るか送り直せる写真が残っているか。 */
export const hasUnsentPhotos = (uploads: readonly PhotoUpload[]): boolean =>
  uploads.some(
    ({ status }) =>
      status === "waiting" || status === "sending" || status === "failed",
  );

/** まだ送り終えていない写真があるか。 */
export const isUploading = (uploads: readonly PhotoUpload[]): boolean =>
  uploads.some(({ status }) => status === "waiting" || status === "sending");

/** 「完了」の前に確かめる、破棄する写真の枚数。 */
export const countDiscarded = (
  uploads: readonly PhotoUpload[],
  hasChanges: (id: number) => boolean,
): number => {
  const discarded = uploads.filter(({ status }) => status !== "added");

  return discarded.some(
    ({ id, status }) => status === "failed" || hasChanges(id),
  )
    ? discarded.length
    : 0;
};

/** 送り終えた写真の結果を閉じる。 */
export const clearFinished = (
  uploads: readonly PhotoUpload[],
): readonly PhotoUpload[] =>
  uploads.filter(({ status }) => status === "waiting" || status === "sending");
