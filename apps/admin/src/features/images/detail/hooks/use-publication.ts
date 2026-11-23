import { setPublication } from "../queries/image-actions";
import type { AdminImage } from "@/queries/image-query";
import { useImageCache } from "./use-image-cache";
import { useImageDialog } from "./use-image-dialog";

import { useAppContext } from "@/api/app-context";
import { useApiMutation } from "@/api/server-state/server-state";
import { useTranslate } from "@/i18n/use-translate";
import { useFailureToast, useShowToast } from "@/ui/primitives/overlays";

/** 画像の公開と非公開を切り替える操作を持つ。 */
export const usePublication = (
  image: Pick<AdminImage, "id" | "published">,
  isDisabled: boolean,
) => {
  const t = useTranslate();
  const dialog = useImageDialog(image.id, isDisabled);
  const failure = useFailureToast(image.id);
  const showToast = useShowToast();
  const cache = useImageCache();
  const { api } = useAppContext();

  const publication = useApiMutation({
    key: ["admin", "images", "publication", image.id],
    scope: `image:${image.id}`,
    send: (published: boolean) =>
      setPublication(api, { id: image.id, published }),
    onSuccess: async (result, published) => {
      if (!published) dialog.close();

      if (result._tag === "Failed") {
        failure.show(t("imageDetail.gone"));
        await Promise.all([
          cache.replaceImage(image.id, result),
          cache.dropFromList(image.id),
        ]);
      } else {
        await cache.applyChange(result.data, "publication");

        const message = result.data.published
          ? "imageDetail.publishDone"
          : "imageDetail.unpublishDone";

        showToast({ tone: "success", message: t(message) });
      }
    },
    onError: () => {
      void cache.refreshList();
      void cache.refreshImage(image.id); // 変えられてから応答だけが失敗したときも、画面を合わせる
      failure.show(t("imageDetail.publicationFailed"));
    },
  });

  const send = (published: boolean): void => {
    failure.close();
    publication.mutate(published);
  };

  return {
    /** 非公開にする確かめを開いているか。 */
    isConfirming: dialog.isOpen,
    /** 切り替えを送っているか。 */
    isPending: publication.isPending,
    /** 公開と非公開を切り替える。 */
    toggle: (): void => {
      if (isDisabled) return;

      if (image.published) dialog.open();
      else send(true);
    },
    /** 確かめたうえで非公開にする。 */
    unpublish: (): void => {
      if (dialog.isOpen) send(false);
    },
    /** 確かめを閉じる。 */
    cancel: (): void => {
      failure.close();
      dialog.close();
    },
  };
};
