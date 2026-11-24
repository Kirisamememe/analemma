import type { PhotoRowStatus } from "@/features/dropbox/logic/photo-rows";

/** 写真の状態の色。 */
export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger";

/** 写真の状態の見せ方。 */
export type StatusView = {
  /** 状態の色。 */
  readonly tone: StatusTone;
  /** 処理している途中か。 */
  readonly busy: boolean;
};

const VIEWS: Readonly<Record<PhotoRowStatus, StatusView>> = {
  new: { tone: "neutral", busy: false },
  imported: { tone: "success", busy: false },
  "image-deleted": { tone: "neutral", busy: false },
  waiting: { tone: "neutral", busy: false },
  importing: { tone: "info", busy: true },
  added: { tone: "success", busy: false },
  "already-added": { tone: "success", busy: false },
  "not-found": { tone: "warning", busy: false },
  changed: { tone: "warning", busy: false },
  "too-large": { tone: "danger", busy: false },
  unsupported: { tone: "danger", busy: false },
  failed: { tone: "danger", busy: false },
};

/** 写真の状態の、色と処理の途中かを返す。 */
export const toStatusView = (status: PhotoRowStatus): StatusView =>
  VIEWS[status];
