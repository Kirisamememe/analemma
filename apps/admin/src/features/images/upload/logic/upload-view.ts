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
  failed: "danger",
} as const satisfies Record<UploadStatus, ProgressTone>;

/** 写真の状態を、一覧の行の見せ方にする。 */
export const toProgressTone = (status: UploadStatus): ProgressTone =>
  TONES[status];

/** 写真の状態を伝える文言のキーを返す。 */
export const toStatusLabel = (
  status: Exclude<UploadStatus, "too-large">,
): MessageKey => {
  if (status === "unreadable") return "images.unreadable";

  if (status === "interrupted") return "images.interrupted";

  return `imageUpload.status.${status}`;
};

/** 写真の行の送り直しの操作(出さない・押せる・送っている最中)。 */
export const retryAction = ({
  status,
  retried,
}: Pick<PhotoUpload, "status" | "retried">): "none" | "ready" | "pending" => {
  if (status === "interrupted") return retried === true ? "pending" : "ready";

  if (status === "failed") return "ready";

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
  if (status === "waiting" || status === "sending") return undefined;

  return imageId === undefined ? "add-button" : "result";
};

/** 写真の転送と登録の全体を1行で伝えるための件数と表示。 */
export const uploadNotice = (uploads: readonly PhotoUpload[]) => {
  if (uploads.length === 0) return undefined;

  const total = uploads.length;
  const added = uploads.filter(({ status }) => status === "added").length;

  const failed = uploads.filter(
    ({ status }) => TONES[status] === "danger",
  ).length;

  const counts = { added, total, failed };

  if (failed === total) {
    return {
      tone: "danger",
      icon: "circle-alert",
      key: "imageUpload.notice.allFailed",
      counts,
    } as const;
  }

  if (failed > 0) {
    return {
      tone: "warning",
      icon: "circle-alert",
      key: "imageUpload.notice.failed",
      counts,
    } as const;
  }

  if (added === total) {
    return {
      tone: "success",
      icon: "circle-check",
      key: "imageUpload.notice.done",
      counts,
    } as const;
  }

  return {
    tone: "info",
    icon: "arrow-up",
    key: "imageUpload.notice.sending",
    counts,
  } as const;
};
