import { type ReactNode, useId } from "react";

import { useImageDialog } from "./hooks/use-image-dialog";
import { deleteImage } from "./queries/image-actions";
import {
  IMAGE_NEIGHBORS_QUERY_KEY,
  imageQueryKey,
} from "./queries/image-query";

import { useAppContext } from "@/api/app-context";
import {
  useApiCache,
  useApiMutation,
  useIsApiMutationPending,
} from "@/api/server-state/server-state";
import {
  IMAGES_QUERY_KEY,
  updateImagePage,
} from "@/features/images/queries/images-query";
import { useTranslate } from "@/i18n/use-translate";
import { Cluster, Text } from "@/ui/layout";
import { Button } from "@/ui/primitives/button";
import {
  Dialog,
  useFailureToast,
  useShowToast,
} from "@/ui/primitives/overlays";

/** 画像を削除するボタンに渡す値。 */
type DeleteImageProps = {
  /** 別の画像を取得していて操作できないか。 */
  isDisabled?: boolean;
  /** 削除する画像の ID。 */
  id: string;
  /** 確かめるときに見せる名前(タイトルか、無題の画像)。 */
  name: string;
  /** 削除できたときに呼ぶ関数。 */
  onDeleted: (id: string) => void;
};

/** 押すと名前を見せて確かめ、画像を削除するボタン。 */
export const DeleteImage = ({
  isDisabled = false,
  id,
  name,
  onDeleted,
}: DeleteImageProps): ReactNode => {
  const t = useTranslate();
  const showToast = useShowToast();
  const failure = useFailureToast();
  const { refresh, update, updatePages } = useApiCache();
  const { api } = useAppContext();
  const dialog = useImageDialog(id, isDisabled);

  const descriptionId = useId();
  const deleteKey = ["admin", "images", "delete", id];
  const isDeleting = useIsApiMutationPending(deleteKey);

  const deleting = useApiMutation({
    key: deleteKey,
    scope: `image:${id}`,
    send: (target: Pick<DeleteImageProps, "id" | "name">) =>
      deleteImage(api, target.id),
    onSuccess: async (result, target) => {
      await updatePages(IMAGES_QUERY_KEY, updateImagePage(target.id));
      void refresh(IMAGE_NEIGHBORS_QUERY_KEY, "active"); // ほかの画像の前後に、消した画像を出さない

      if (result._tag === "Succeeded") {
        showToast({
          tone: "success",
          message: t("imageDetail.deleted", { title: target.name }),
        });

        onDeleted(target.id);
        void refresh(imageQueryKey(target.id), "active");
      } else {
        await update(imageQueryKey(target.id), () => result);
        dialog.close();
        failure.show(t("imageDetail.gone"));
      }
    },
    onError: (target) => {
      failure.show(t("imageDetail.deleteFailed"));
      void refresh(imageQueryKey(target.id), "active");
      void refresh(IMAGE_NEIGHBORS_QUERY_KEY, "active");
      void refresh(IMAGES_QUERY_KEY, "active"); // 削除できてから応答だけが失敗したときも、一覧を合わせる
    },
  });

  const close = (): void => {
    failure.close();
    dialog.close();
  };

  return (
    <>
      <Button
        size="sm-to-md"
        aria-label={t("imageDetail.delete")}
        icon="trash-2"
        isPending={isDeleting && !dialog.isOpen}
        onPress={() => {
          if (isDisabled || isDeleting) return;

          deleting.reset(); // 開き直したら、前の送信の結果を消す
          dialog.open();
        }}
      />
      <Dialog
        descriptionId={descriptionId}
        isOpen={dialog.isOpen}
        isPending={deleting.isPending}
        onOpenChange={(open) => {
          if (!open) close();
        }}
        title={t("imageDetail.deleteTitle", { title: name })}
      >
        <Text>
          <span id={descriptionId}>{t("imageDetail.deleteDescription")}</span>
        </Text>
        <Cluster gap={2} justify="end">
          <Button isDisabled={deleting.isPending} onPress={close}>
            {t("imageDetail.cancel")}
          </Button>
          <Button
            isDisabled={deleting.data?._tag === "Failed"}
            isPending={deleting.isPending}
            onPress={() => {
              if (dialog.isOpen) {
                failure.close();
                deleting.mutate({ id, name }); // 閉じ始めた後に遅れて届いた押下では送らない
              }
            }}
            tone="danger"
          >
            {t("imageDetail.confirmDelete")}
          </Button>
        </Cluster>
      </Dialog>
    </>
  );
};
