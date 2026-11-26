import { useCallback, useRef, useState } from "react";

import { imageSaveKey } from "../queries/image-actions";
import { type AdminImage, loadImage } from "../queries/image-query";
import { useImageCache } from "./use-image-cache";

import { useAppContext } from "@/api/app-context";
import {
  useApiMutation,
  useIsApiMutationPending,
} from "@/api/server-state/server-state";
import { useTranslate } from "@/i18n/use-translate";
import { useFailureToast } from "@/ui/primitives/overlays";

type EditRequest = Pick<AdminImage, "id">;

/** 編集する画像を用意し、編集を開く・閉じる操作を返す。 */
export const useOpenImageEditor = (id: string, isDisabled: boolean) => {
  const t = useTranslate();
  const { api } = useAppContext();
  const cache = useImageCache();
  const failure = useFailureToast(id);
  const [editing, setEditing] = useState<AdminImage>();
  const [openingId, setOpeningId] = useState<string>();
  const request = useRef<EditRequest>(undefined);
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
        await cache.refreshImage(target.id);
      }
    },
    onError: (target) => {
      if (request.current === target) {
        request.current = undefined;
        failure.show(t("imageDetail.loadFailed"));
      }
    },
  });

  return {
    /** 編集している画像(閉じていれば undefined)。 */
    editing,
    /** 開くための取得か、保存を待っているか。 */
    isPending:
      isSaving || (opening.isPending && !isDisabled && openingId === id),
    /** 編集のボタンに付ける ref。 */
    attach,
    /** 今の値を取得して、編集を開く。 */
    open: (): void => {
      if (isDisabled) return;

      failure.close();
      const target = { id };
      setOpeningId(id);
      request.current = target;
      opening.mutate(target);
    },
    /** 開いていた画像の編集を閉じる。 */
    close: (target: AdminImage): void => {
      setEditing((current) => (current === target ? undefined : current));
    },
  };
};
