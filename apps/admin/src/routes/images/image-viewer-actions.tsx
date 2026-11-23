import { useNavigate, useRouter } from "@tanstack/react-router";
import { Fragment, use, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { ImageViewerContext } from "./image-viewer-context";

import { DeleteImage } from "@/features/images/detail/delete-image";
import { EditImage } from "@/features/images/detail/edit-image";
import { PublicationButton } from "@/features/images/detail/publication-button";

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
    <Fragment key={id}>
      <EditImage image={shown} isDisabled={isDisabled} />
      <PublicationButton image={shown} isDisabled={isDisabled} />
      <DeleteImage
        id={shown.id}
        name={shown.title ?? t("imageDetail.untitled")}
        isDisabled={isDisabled}
        onDeleted={(deletedId) => {
          if (
            router.state.location.pathname
              .toLowerCase()
              .replace(/\/+$/v, "") === `/images/${deletedId}`
          ) {
            void navigate({ to: "/images" });
          }
        }}
      />
    </Fragment>
  );
};
