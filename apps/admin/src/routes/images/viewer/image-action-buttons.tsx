import { useNavigate, useRouter } from "@tanstack/react-router";
import { memo, type ReactNode } from "react";

import type { ApiOutputs } from "@/api/api-types";
import { DeleteImage } from "@/features/images/detail/delete-image";
import { EditImage } from "@/features/images/detail/edit-image";
import { PublicationButton } from "@/features/images/detail/publication-button";
import { ViewerActions } from "@/features/images/ui/viewer/viewer-actions";
import { isConverted } from "@/queries/image-query";

/** 画像の操作のボタンに渡す値。 */
type ImageActionButtonsProps = {
  /** 操作する画像。 */
  image: ApiOutputs["admin"]["images"]["get"];
  /** 操作を受け付けないか。 */
  isDisabled: boolean;
  /** 削除の確認で見せる名前。 */
  name: string;
};

const ImageActionButtonsContent = ({
  image,
  name,
  isDisabled,
}: ImageActionButtonsProps): ReactNode => {
  const navigate = useNavigate();
  const router = useRouter();

  return (
    <ViewerActions disabled={isDisabled}>
      <EditImage image={image} isDisabled={isDisabled} />
      {isConverted(image) && (
        <PublicationButton image={image} isDisabled={isDisabled} />
      )}
      <DeleteImage
        id={image.id}
        name={name}
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
    </ViewerActions>
  );
};

/** 画像の編集・公開と非公開・削除のボタン。 */
export const ImageActionButtons = memo(ImageActionButtonsContent);
