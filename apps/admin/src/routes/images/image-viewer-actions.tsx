import { useNavigate, useRouter } from "@tanstack/react-router";
import { use, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { ImageViewerContext } from "./image-viewer-context";

import type { ApiOutputs } from "@/api/api-types";
import { DeleteImage } from "@/features/images/detail/delete-image";
import { EditImage } from "@/features/images/detail/edit-image";
import { PublicationButton } from "@/features/images/detail/publication-button";
import { ViewerActions } from "@/features/images/ui/viewer-visit";

type Image = ApiOutputs["admin"]["images"]["get"];

/** 表示中の画像の編集・公開・削除の操作。 */
export const ImageViewerActions = (): ReactNode => {
  const state = use(ImageViewerContext);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const router = useRouter();

  if (state?.shown === undefined) return null;

  const { id, shown } = state;

  const isDisabled = shown.id !== id || state.query._tag !== "Loaded";

  return (
    <ImageActionButtons
      image={shown}
      isDisabled={isDisabled}
      name={shown.title ?? t("imageDetail.untitled")}
      onDeleted={(deletedId) => {
        if (router.state.location.pathname.toLowerCase().replace(/\/+$/v, "") === `/images/${deletedId}`) {
          void navigate({ to: "/images" });
        }
      }}
    />
  );
};

type ImageActionButtonsProps = {
  /** 操作する画像。 */
  image: Image;
  /** 操作を受け付けないか。 */
  isDisabled: boolean;
  /** 削除の確認で見せる名前。 */
  name: string;
  /** 画像を削除した後に呼ぶ関数。 */
  onDeleted: (id: string) => void;
};

const ImageActionButtons = ({
  image,
  name,
  isDisabled,
  onDeleted,
}: ImageActionButtonsProps): ReactNode => (
  <ViewerActions disabled={isDisabled}>
    <EditImage image={image} isDisabled={isDisabled} />
    <PublicationButton image={image} isDisabled={isDisabled} />
    <DeleteImage
      id={image.id}
      name={name}
      isDisabled={isDisabled}
      onDeleted={onDeleted}
    />
  </ViewerActions>
);
