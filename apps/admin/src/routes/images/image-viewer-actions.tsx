import { useNavigate, useParams, useRouter } from "@tanstack/react-router";
import { Fragment, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import type { ApiOutputs } from "@/api/api-types";
import { DeleteImage } from "@/features/images/detail/delete-image";
import { EditImage } from "@/features/images/detail/edit-image";
import { useViewerImage } from "@/features/images/detail/hooks/use-viewer-image";
import { PublicationButton } from "@/features/images/detail/publication-button";

type Image = ApiOutputs["admin"]["images"]["get"];

/** 表示中の画像の編集・公開・削除の操作。 */
export const ImageViewerActions = (): ReactNode => {
  const id = useParams({
    from: "/images/$id",
    select: (params) => params.id.toLowerCase(),
  });

  const query = useViewerImage(id);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const router = useRouter();

  const current =
    query._tag === "Loaded" && query.data._tag === "Succeeded"
      ? query.data.data
      : undefined;

  const [last, setLast] = useState<Image>();

  if (current !== undefined && current !== last) setLast(current);

  const shown = current ?? (query._tag === "Loading" ? last : undefined);

  if (shown === undefined) return null;

  const isDisabled = current === undefined || current.id !== id;

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
