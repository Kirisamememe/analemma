import type { PhotoUpload, UploadStatus } from "./photo-uploads";

import type { MessageKey } from "@/i18n/use-translate";
import type { ProgressTone } from "@/ui/patterns";

const KILOBYTE = 1024;
const MEGABYTE = KILOBYTE * KILOBYTE;

/** ファイルの大きさを、言語の書き方で KB か MB にする。 */
export const formatFileSize = (locale: string, bytes: number): string =>
  bytes < MEGABYTE
    ? new Intl.NumberFormat(locale, {
        style: "unit",
        unit: "kilobyte",
      }).format(Math.max(1, Math.ceil(bytes / KILOBYTE)))
    : new Intl.NumberFormat(locale, {
        style: "unit",
        unit: "megabyte",
        maximumFractionDigits: 1,
      }).format(bytes / MEGABYTE);

const TONES = {
  waiting: "neutral",
  sending: "info",
  converting: "info",
  added: "success",
  "too-large": "danger",
  unsupported: "danger",
  unreadable: "danger",
  interrupted: "danger",
  replacing: "neutral",
  failed: "danger",
} as const satisfies Record<UploadStatus, ProgressTone>;

/** 写真の状態を、一覧の行の見せ方にする。 */
export const toProgressTone = (status: UploadStatus): ProgressTone =>
  TONES[status];

/** 写真の状態を伝える文言のキーを返す。 */
export const toStatusLabel = (status: UploadStatus): MessageKey =>
  status === "replacing"
    ? "imageUpload.status.waiting"
    : `imageUpload.status.${status}`;

/** 写真の行の送り直しの操作(出さない・押せる・送っている最中)。 */
export const retryAction = ({
  status,
  retried,
}: Pick<PhotoUpload, "status" | "retried">): "none" | "ready" | "pending" => {
  if (status === "interrupted" || status === "failed") return "ready";

  if (status === "replacing") return "pending";

  return retried === true && (status === "waiting" || status === "sending")
    ? "pending"
    : "none";
};

/** 送り直しが済んだ写真の行で、focus を引き継ぐ先(まだ済んでいなければ無し)。 */
export const focusAfterRetry = ({
  status,
  imageId,
}: Pick<PhotoUpload, "status" | "imageId">):
  | "result"
  | "add-button"
  | undefined => {
  if (status === "waiting" || status === "sending" || status === "replacing") {
    return undefined;
  }

  return imageId === undefined ? "add-button" : "result";
};
