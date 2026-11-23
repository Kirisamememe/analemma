import { useState } from "react";

import { closePrompt } from "../logic/close-prompt";
import {
  hasUnsavedChanges,
  type ImageText,
  isValidImageText,
  toImageText,
} from "../logic/image-text";
import { imageSaveKey, saveImage } from "../queries/image-actions";
import type { AdminImage } from "../queries/image-query";
import { useImageCache } from "./use-image-cache";

import { useAppContext } from "@/api/app-context";
import { useApiMutation } from "@/api/server-state/server-state";
import { useLeaveConfirmation } from "@/api/use-leave-confirmation";
import { checkAfterSubmit, useAppForm } from "@/components/forms";
import { type MessageKey, useTranslate } from "@/i18n/use-translate";
import { useFailureToast, useShowToast } from "@/ui/primitives/overlays";

const INVALID: Readonly<Record<keyof ImageText, MessageKey>> = {
  title: "imageDetail.invalidTitle",
  description: "imageDetail.invalidDescription",
  alt: "imageDetail.invalidAlt",
};

/** 画像のタイトル・説明・alt の入力と保存、閉じる前・離れる前の確かめを持つ。 */
export const useImageTextEditor = (image: AdminImage, onClose: () => void) => {
  const t = useTranslate();
  const showToast = useShowToast();
  const failure = useFailureToast();
  const cache = useImageCache();
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
    send: async (values: ImageText) => ({
      id: image.id,
      result: await saveImage(api, { id: image.id, values }),
    }),
    onSuccess: async ({ result, id }) => {
      if (result._tag === "Saved") {
        await cache.applyChange(result.image, "text");
        leaving.leave();
        onClose();
        showToast({ tone: "success", message: t("imageDetail.saved") });
      } else {
        failure.show(t("imageDetail.gone"));
        leaving.leave();
        onClose();
        await Promise.all([cache.refreshImage(id), cache.dropFromList(id)]);
      }
    },
    onError: () => {
      failure.show(t("imageDetail.saveFailed"));
      void cache.refreshImage(image.id, "active");
      void cache.refreshList();
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
  const whileSaving = leaving._tag === "Asking" && saving.isPending;

  return {
    /** 入力のフォーム。 */
    form,
    /** 保存を送っているか。 */
    isSaving: saving.isPending,
    /** 閉じる前・離れる前の確かめ。 */
    confirmation: {
      /** 確かめを出しているか。 */
      isOpen: confirmClose || leaving._tag === "Asking",
      /** 保存を送っている間に離れようとしているか。 */
      whileSaving,
      /** 確かめに出す文言。 */
      messages: closePrompt(whileSaving),
    },
    /** 欄の値を、送った後から確かめる validator。 */
    check: (name: keyof ImageText) =>
      checkAfterSubmit((value: string) =>
        isValidImageText(name, value) ? undefined : t(INVALID[name]),
      ),
    /** 変更があれば確かめてから、無ければすぐに閉じる。 */
    requestClose: (): void => {
      if (changed()) setConfirmClose(true);
      else close();
    },
    /** 確かめをやめて、入力を続ける。 */
    stay: (): void => {
      leaving.stay();
      setConfirmClose(false);
    },
    /** 確かめたうえで、入力を捨てて閉じるか、止めた移動を続ける。 */
    leave: (): void => {
      leaving.leave();
      close();
    },
  };
};
