import { deleteImage } from "../queries/image-actions";
import { useImageCache } from "./use-image-cache";
import { useImageDialog } from "./use-image-dialog";

import { useAppContext } from "@/api/app-context";
import {
  useApiMutation,
  useIsApiMutationPending,
} from "@/api/server-state/server-state";
import { useTranslate } from "@/i18n/use-translate";
import { useFailureToast, useShowToast } from "@/ui/primitives/overlays";

/** 削除する画像と、確かめに見せる名前。 */
type DeleteTarget = {
  /** 削除する画像の ID。 */
  readonly id: string;
  /** 確かめるときに見せる名前(タイトルか、無題の画像)。 */
  readonly name: string;
};

/** 削除の操作に渡す値。 */
type DeleteOptions = DeleteTarget & {
  /** 別の画像を取得していて操作できないか。 */
  readonly isDisabled: boolean;
  /** 削除できたときに呼ぶ関数。 */
  readonly onDeleted: (id: string) => void;
};

/** 名前を見せて確かめてから画像を削除し、一覧と前後から外す。 */
export const useDeleteImage = ({
  id,
  name,
  isDisabled,
  onDeleted,
}: DeleteOptions) => {
  const t = useTranslate();
  const showToast = useShowToast();
  const failure = useFailureToast(id);
  const cache = useImageCache();
  const { api } = useAppContext();
  const dialog = useImageDialog(id, isDisabled);
  const deleteKey = ["admin", "images", "delete", id];
  const isDeleting = useIsApiMutationPending(deleteKey);

  const deleting = useApiMutation({
    key: deleteKey,
    scope: `image:${id}`,
    send: (target: DeleteTarget) => deleteImage(api, target.id),
    onSuccess: async (result, target) => {
      await cache.dropFromList(target.id);
      void cache.refreshNeighbors(); // ほかの画像の前後に、消した画像を出さない

      if (result._tag === "Succeeded") {
        showToast({
          tone: "success",
          message: t("imageDetail.deleted", { title: target.name }),
        });

        onDeleted(target.id);
        void cache.refreshImage(target.id, "active");
      } else {
        await cache.replaceImage(target.id, result);
        dialog.close();
        failure.show(t("imageDetail.gone"));
      }
    },
    onError: (target) => {
      failure.show(t("imageDetail.deleteFailed"));
      void cache.refreshImage(target.id, "active");
      void cache.refreshNeighbors();
      void cache.refreshList(); // 削除できてから応答だけが失敗したときも、一覧を合わせる
    },
  });

  return {
    /** 確かめを開いているか。 */
    isConfirming: dialog.isOpen,
    /** この画像の削除を送っているか(ほかの画面で送ったものも含む)。 */
    isDeleting,
    /** この確かめから送った削除を待っているか。 */
    isPending: deleting.isPending,
    /** 送った画像がもう無かったか(確かめを開き直すまで、送り直させない)。 */
    isGone: deleting.data?._tag === "Failed",
    /** 確かめを開く。 */
    confirm: (): void => {
      if (isDisabled || isDeleting) return;

      deleting.reset(); // 開き直したら、前の送信の結果を消す
      dialog.open();
    },
    /** 確かめたうえで削除を送る。 */
    remove: (): void => {
      if (!dialog.isOpen) return; // 閉じ始めた後に遅れて届いた押下では送らない

      failure.close();
      deleting.mutate({ id, name });
    },
    /** 確かめを閉じる。 */
    cancel: (): void => {
      failure.close();
      dialog.close();
    },
  };
};
