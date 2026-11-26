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
  readonly percent?: number;
  /** 足せたときの、画像の ID。 */
  readonly imageId?: string | undefined;
  /** 元の写真を表示できないときに使う配信用の URL。 */
  readonly previewUrl?: string | undefined;
  /** 送れなかった後に、送り直したか。 */
  readonly retried?: boolean | undefined;
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

const MAX_IN_FLIGHT = 2;

/** 送信中の写真と合わせて2枚まで、待機中の写真を選んだ順に返す。 */
export const nextUploads = (
  uploads: readonly PhotoUpload[],
): readonly PhotoUpload[] => {
  const available =
    MAX_IN_FLIGHT - uploads.filter(({ status }) => status === "sending").length;

  return uploads
    .filter(({ status }) => status === "waiting")
    .slice(0, Math.max(0, available));
};

/** 写真の状態を変える。 */
export const withStatus =
  (id: number, status: UploadStatus) =>
  (uploads: readonly PhotoUpload[]): readonly PhotoUpload[] =>
    uploads.map((upload) =>
      upload.id === id
        ? { ...upload, status, ...(status === "sending" && { percent: 0 }) }
        : upload,
    );

/** 写真の送信済みの割合を更新する。 */
export const withUploadProgress =
  (id: number, fraction: number) =>
  (uploads: readonly PhotoUpload[]): readonly PhotoUpload[] =>
    uploads.map((upload) =>
      upload.id === id && upload.status === "sending"
        ? {
            ...upload,
            percent:
              fraction === 1 ? 100 : Math.min(99, Math.round(fraction * 100)),
          }
        : upload,
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
            imageId: image.id,
            previewUrl: image.deliveryImages[0]?.url,
          }
        : upload,
    );

/** 送れなかった写真を、送り直す写真として待たせる。 */
export const retryUpload =
  (id: number) =>
  (uploads: readonly PhotoUpload[]): readonly PhotoUpload[] =>
    uploads.map((upload) =>
      upload.id === id && upload.status === "failed"
        ? { ...upload, status: "waiting", retried: true }
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

/** 送り終えた写真の結果を閉じる。 */
export const clearFinished = (
  uploads: readonly PhotoUpload[],
  retained?: ReadonlySet<number>,
): readonly PhotoUpload[] =>
  uploads.filter(
    ({ id, status }) =>
      status === "waiting" ||
      status === "sending" ||
      retained?.has(id) === true,
  );
