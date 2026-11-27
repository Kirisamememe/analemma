import { use, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { ImageActionButtons } from "./image-action-buttons";
import { ImageViewerContext } from "./image-viewer-context";

/** 表示中の画像の編集・公開・削除の操作。 */
export const ImageViewerActions = (): ReactNode => {
  const state = use(ImageViewerContext);
  const { t } = useTranslation();

  if (state?.shown === undefined) return null;

  const { id, shown } = state;

  const isDisabled = shown.id !== id || state.query._tag !== "Loaded";

  return (
    <ImageActionButtons
      image={shown}
      isDisabled={isDisabled}
      name={shown.title ?? t("imageDetail.untitled")}
    />
  );
};
