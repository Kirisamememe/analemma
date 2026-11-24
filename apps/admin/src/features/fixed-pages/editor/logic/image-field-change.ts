import type { ImageSummary } from "@/queries/images-query";

/** 画像の項目の操作、または確定する画像。 */
export type ImageFieldAction =
  | "choose"
  | "cancel"
  | "remove"
  | Pick<ImageSummary, "id">;

/** 操作の後に表示する Dialog と、フォームに残す画像の ID。 */
export const changeImageField = (
  value: string | null,
  action: ImageFieldAction,
) => {
  if (typeof action === "string") {
    return {
      open: action === "choose",
      value: action === "remove" ? null : value,
    };
  }

  return {
    open: false,
    value: value?.toLowerCase() === action.id.toLowerCase() ? value : action.id,
  };
};
