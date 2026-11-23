import { useNavigate, useRouter } from "@tanstack/react-router";
import { type ReactNode, use } from "react";
import { useTranslation } from "react-i18next";

import { ViewerTargetContext } from "./image-viewer-context";
import { isViewingImage } from "./logic/viewing-image";

import { DeleteImage } from "@/features/images/detail/delete-image";
import { EditImage } from "@/features/images/detail/edit-image";
import { PublicationButton } from "@/features/images/detail/publication-button";
import { ViewerActions } from "@/features/images/ui/viewer-visit";

/** 表示中の画像の編集・公開・削除の操作。 */
export const ImageViewerActions = (): ReactNode => {
  const target = use(ViewerTargetContext);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const router = useRouter();

  if (target === undefined) return null;

  const { image, isDisabled } = target;

  return (
    <ViewerActions disabled={isDisabled}>
      <EditImage image={image} isDisabled={isDisabled} />
      <PublicationButton image={image} isDisabled={isDisabled} />
      <DeleteImage
        id={image.id}
        name={image.title ?? t("imageDetail.untitled")}
        isDisabled={isDisabled}
        onDeleted={(deletedId) => {
          if (isViewingImage(router.state.location.pathname, deletedId)) {
            void navigate({ to: "/images" });
          }
        }}
      />
    </ViewerActions>
  );
};
