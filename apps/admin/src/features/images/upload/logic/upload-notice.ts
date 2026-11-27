import type { PhotoUpload, UploadStatus } from "./photo-uploads";

const DETAILS = [
  ["imageUpload.notice.converting", ["converting"]],
  ["imageUpload.notice.unreadable", ["unreadable"]],
  ["imageUpload.notice.retryable", ["failed", "interrupted"]],
  ["imageUpload.notice.rejected", ["too-large", "unsupported"]],
] as const satisfies readonly (readonly [string, readonly UploadStatus[]])[];

const FAILURES: readonly UploadStatus[] = [
  "failed",
  "interrupted",
  "unreadable",
  "too-large",
  "unsupported",
];

const HEADLINES = {
  allFailed: { tone: "danger", icon: "circle-alert" },
  failed: { tone: "warning", icon: "circle-alert" },
  done: { tone: "success", icon: "circle-check" },
  sending: { tone: "info", icon: "cloud-upload" },
} as const;

/** 写真の転送と登録の全体を伝える、見出しの件数と、状態ごとの補足。 */
export const uploadNotice = (uploads: readonly PhotoUpload[]) => {
  if (uploads.length === 0) return undefined;

  const count = (statuses: readonly UploadStatus[]): number =>
    uploads.filter(({ status }) => statuses.includes(status)).length;

  const total = uploads.length;
  const added = count(["added"]);
  const failed = count(FAILURES);

  const headline =
    failed === total
      ? "allFailed"
      : failed > 0
        ? "failed"
        : added === total
          ? "done"
          : "sending";

  return {
    ...HEADLINES[headline],
    key: `imageUpload.notice.${headline}`,
    counts: { added, total, failed },
    details: DETAILS.flatMap(([key, statuses]) => {
      const matched = count(statuses);

      return matched > 0 ? [{ key, count: matched }] : [];
    }),
  } as const;
};
