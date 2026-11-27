import type { MessageKey } from "@/i18n/use-translate";
import type { AdminImage } from "@/queries/image-query";

/** 画像の状態を、一覧と写真の画面で伝えるための文言と色。 */
export type ImageStatusView = {
  /** バッジに出す文言(公開の画像には出さない)。 */
  readonly badge: MessageKey | undefined;
  /** バッジの色の用途。 */
  readonly tone: "neutral" | "info" | "danger";
  /** 配信用の画像が無いときに、写真の場所に出す文言。 */
  readonly missing: MessageKey;
  /** 配信用の画像ができるのを待っているか。 */
  readonly isPending: boolean;
};

/** 画像の状態から、一覧と写真の画面で伝える文言と色を決める。 */
export const toImageStatusView = (
  status: AdminImage["status"],
): ImageStatusView => {
  switch (status) {
    case "processing":
      return {
        badge: "images.converting",
        tone: "info",
        missing: "images.convertingImage",
        isPending: true,
      };
    case "unreadable":
      return {
        badge: "images.conversionFailed",
        tone: "danger",
        missing: "images.unreadable",
        isPending: false,
      };
    case "interrupted":
      return {
        badge: "images.conversionFailed",
        tone: "danger",
        missing: "images.interrupted",
        isPending: false,
      };
    case "unpublished":
      return {
        badge: "images.unpublished",
        tone: "neutral",
        missing: "images.noDeliveryImage",
        isPending: false,
      };
    case "published":
      return {
        badge: undefined,
        tone: "neutral",
        missing: "images.noDeliveryImage",
        isPending: false,
      };
  }
};
