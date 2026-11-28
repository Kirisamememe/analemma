import { type ReactNode, useCallback, useRef, useState } from "react";

import { EditImageDialog } from "./edit/edit-image-dialog";
import { imageSaveKey } from "./queries/image-actions";

import type { ApiOutputs } from "@/api/api-types";
import { useAppContext } from "@/api/app-context";
import { useIsApiMutationPending } from "@/api/server-state/pending-state";
import { useApiCache, useApiMutation } from "@/api/server-state/server-state";
import { useTranslate } from "@/i18n/use-translate";
import { imageQueryKey, loadImage } from "@/queries/image-query";
import { Button } from "@/ui/primitives/button";
import { Icon } from "@/ui/primitives/graphics";
import { useFailureToast } from "@/ui/primitives/overlays";

type Image = ApiOutputs["admin"]["images"]["get"];

/** 編集する画像に渡す値。 */
type EditImageProps = {
  /** 別の画像を取得していて操作できないか。 */
  isDisabled?: boolean;
  /** 編集する画像。 */
  image: Image;
};

type EditRequest = Pick<Image, "id">;

/** 押すとタイトル・説明・alt を編集する Dialog を開く。 */
export const EditImage = ({
  image,
  isDisabled = false,
}: EditImageProps): ReactNode => {
  const t = useTranslate();
  const { api } = useAppContext();
  const { refresh } = useApiCache();
  const failure = useFailureToast(image.id);
  const [editing, setEditing] = useState<Image>();
  const [openingId, setOpeningId] = useState<string>();
  const request = useRef<EditRequest>(undefined);
  const id = image.id;
  const isSaving = useIsApiMutationPending(imageSaveKey(id));

  const attach = useCallback(
    (button: HTMLButtonElement | null) => {
      if (button === null || isDisabled || request.current?.id !== id) {
        request.current = undefined;
      }
    },
    [id, isDisabled],
  );

  if (editing !== undefined && (isDisabled || editing.id !== id)) {
    setEditing(undefined);
  }

  if (openingId !== undefined && (isDisabled || openingId !== id)) {
    setOpeningId(undefined);
  }

  const opening = useApiMutation({
    key: ["admin", "images", "edit", id],
    scope: `image:${id}`,
    send: (target: EditRequest) => loadImage(api, target.id),
    onSuccess: async (result, target) => {
      if (request.current !== target) return;

      request.current = undefined;

      if (result._tag === "Succeeded") setEditing(result.data);
      else {
        failure.show(t("imageDetail.gone"));
        await refresh(imageQueryKey(target.id));
      }
    },
    onError: (target) => {
      if (request.current === target) {
        request.current = undefined;
        failure.show(t("imageDetail.loadFailed"));
      }
    },
  });

  const open = (): void => {
    if (isDisabled) return;

    failure.close();
    const target = { id };
    setOpeningId(id);
    request.current = target;
    opening.mutate(target);
  };

  const close = (): void => {
    setEditing((current) => (current === editing ? undefined : current));
  };

  return (
    <>
      <Button
        size="sm-to-md"
        isPending={
          isSaving || (opening.isPending && !isDisabled && openingId === id)
        }
        ref={attach}
        onPress={open}
      >
        <Icon name="pencil" />
        {t("imageDetail.edit")}
      </Button>
      {editing !== undefined && (
        <EditImageDialog key={editing.id} image={editing} onClose={close} />
      )}
    </>
  );
};
