import type { ApiClient } from "@/api/api-types";
import {
  type ImageText,
  toImageText,
} from "@/features/images/detail/logic/image-text";
import { saveImage } from "@/features/images/detail/queries/image-actions";
import { loadImage } from "@/features/images/detail/queries/image-query";

/** 写真を送った後に入力するタイトルと説明。 */
export type UploadMetadata = Pick<ImageText, "title" | "description">;

type MetadataChange = {
  /** 画像の ID。 */
  readonly imageId: string;
  /** 画面で残りの保存を続けるか。 */
  readonly isActive: () => boolean;
  /** 変更した欄。 */
  readonly changes: Partial<UploadMetadata>;
};

/** 最新の画像に、送り終えた写真のフォームで変更した欄を反映する。 */
export const saveUploadMetadata = async (
  api: ApiClient,
  { imageId: id, changes, isActive }: MetadataChange,
) => {
  const latest = await loadImage(api, id);

  if (latest._tag === "Failed") return { _tag: "NotFound" } as const;

  if (!isActive()) return { _tag: "Stopped" } as const;

  return saveImage(api, {
    id,
    values: { ...toImageText(latest.data), ...changes },
  });
};
