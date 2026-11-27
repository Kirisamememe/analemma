import { useState } from "react";

import {
  hasUnsavedChanges,
  isValidImageText,
  toImageText,
} from "../../logic/image-text";
import { mergeImageChange } from "../../logic/merge-image-change";
import { imageSaveKey, saveImage } from "../../queries/image-actions";

import type { ApiOutputs } from "@/api/api-types";
import { useAppContext } from "@/api/app-context";
import { useApiCache, useApiMutation } from "@/api/server-state/server-state";
import { useLeaveConfirmation } from "@/api/use-leave-confirmation";
import { checkAfterSubmit, useAppForm } from "@/components/forms";
import { type MessageKey, useTranslate } from "@/i18n/use-translate";
import { imageQueryKey, type LoadedImage } from "@/queries/image-query";
import { IMAGES_QUERY_KEY, updateImagePage } from "@/queries/images-query";
import { useFailureToast, useShowToast } from "@/ui/primitives/overlays";

const INVALID: Readonly<Record<"title" | "description" | "alt", MessageKey>> = {
  title: "imageDetail.invalidTitle",
  description: "imageDetail.invalidDescription",
  alt: "imageDetail.invalidAlt",
};

/** 画像のタイトル・説明・alt を編集する Dialog に渡す値。 */
export type EditImageDialogProps = {
  /** 編集する画像。 */
  image: ApiOutputs["admin"]["images"]["get"];
  /** 閉じる関数。 */
  onClose: () => void;
};

/** 画像のタイトル・説明・alt の入力と保存、保存していない変更を残して閉じるときの確かめを持つ。 */
export const useEditImage = ({ image, onClose }: EditImageDialogProps) => {
  const t = useTranslate();
  const showToast = useShowToast();
  const failure = useFailureToast();
  const { refresh, update, updatePages } = useApiCache();
  const { api } = useAppContext();

  const [confirmClose, setConfirmClose] = useState(false);
  const initial = toImageText(image);

  const close = (): void => {
    failure.close();
    onClose();
  };

  const saving = useApiMutation({
    key: imageSaveKey(image.id),
    scope: `image:${image.id}`,
    send: async (values: ReturnType<typeof toImageText>) => ({
      id: image.id,
      result: await saveImage(api, { id: image.id, values }),
    }),
    onSuccess: async ({ result, id }) => {
      if (result._tag === "Saved") {
        const apply = mergeImageChange(result.image, "text");
        await Promise.all([
          update<LoadedImage>(imageQueryKey(result.image.id), (current) =>
            current._tag === "Succeeded"
              ? { ...current, data: apply(current.data) }
              : current,
          ),
          updatePages(
            IMAGES_QUERY_KEY,
            updateImagePage(result.image.id, apply),
          ),
        ]);
        leaving.leave();
        onClose();
        showToast({ tone: "success", message: t("imageDetail.saved") });
      } else {
        failure.show(t("imageDetail.gone"));
        leaving.leave();
        onClose();
        await Promise.all([
          refresh(imageQueryKey(id)),
          updatePages(IMAGES_QUERY_KEY, updateImagePage(id)),
        ]);
      }
    },
    onError: () => {
      failure.show(t("imageDetail.saveFailed"));
      void refresh(imageQueryKey(image.id), "active");
      void refresh(IMAGES_QUERY_KEY, "active");
    },
  });

  const form = useAppForm({
    canSubmitWhenInvalid: true,
    defaultValues: initial,
    onSubmit: ({ value }) => {
      failure.close();
      saving.mutate(value);
    },
  });

  const changed = (): boolean => hasUnsavedChanges(initial, form.state.values);

  const leaving = useLeaveConfirmation(() => saving.isPending || changed());

  const leavingWhileSaving = leaving._tag === "Asking" && saving.isPending;

  const requestClose = (): void => {
    if (changed()) setConfirmClose(true);
    else close();
  };

  const stay = (): void => {
    leaving.stay();

    setConfirmClose(false);
  };

  const check = (name: keyof typeof INVALID) =>
    checkAfterSubmit((value: string) =>
      isValidImageText(name, value) ? undefined : t(INVALID[name]),
    );

  return {
    form,
    isSaving: saving.isPending,
    check,
    requestClose,
    stay,
    discard: (): void => {
      leaving.leave();
      close();
    },
    confirmation: {
      isOpen: confirmClose || leaving._tag === "Asking",
      whileSaving: leavingWhileSaving,
    },
  };
};

/** 画像の文言を編集するフォームと、その操作。 */
export type ImageEditor = ReturnType<typeof useEditImage>;
