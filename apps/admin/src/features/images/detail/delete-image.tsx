import { type ReactNode, useRef, useState } from "react";

import { deleteImage } from "./queries/image-actions";

import { useAppContext } from "@/api/app-context";
import { useApiCache, useApiMutation } from "@/api/server-state/server-state";
import { IMAGES_QUERY_KEY } from "@/features/images/queries/images-query";
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
  /** 削除する画像の ID。 */
  id: string;
  /** 確かめるときに見せる名前(タイトルか、無題の画像)。 */
  name: string;
  /** 削除できたときに呼ぶ関数。 */
  onDeleted: () => void;
};

/** 押すと名前を見せて確かめ、画像を削除するボタン。 */
export const DeleteImage = ({
  id,
  name,
  onDeleted,
}: DeleteImageProps): ReactNode => {
  const t = useTranslate();
  const showToast = useShowToast();
  const failure = useFailureToast();
  const { refresh } = useApiCache();
  const { api } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null); // 画面を閉じると null になる

  const deleting = useApiMutation({
    send: () => deleteImage(api, id),
    onSuccess: async ({ _tag }) => {
      await refresh(IMAGES_QUERY_KEY); // 一覧に戻ったとき、消した画像を出さない

      if (_tag === "Deleted") {
        showToast({
          tone: "success",
          message: t("imageDetail.deleted", { title: name }),
        });

        if (trigger.current !== null) onDeleted(); // 画面を閉じていたら、移った先の画面から動かさない
      } else {
        failure.show(t("imageDetail.gone"));
      }
    },
    onError: () => {
      failure.show(t("imageDetail.deleteFailed"));
      void refresh(IMAGES_QUERY_KEY); // 削除できてから応答だけが失敗したときも、一覧を合わせる
    },
  });

  const close = (): void => {
    failure.close();
    setIsOpen(false);
  };

  return (
    <>
      <Button
        aria-label={t("imageDetail.delete")}
        icon="trash-2"
        ref={trigger}
        onPress={() => {
          deleting.reset(); // 開き直したら、前の送信の結果を消す
          setIsOpen(true);
        }}
      />
      <Dialog
        isOpen={isOpen}
        isPending={deleting.isPending}
        onOpenChange={(open) => {
          if (!open) close();
        }}
        title={t("imageDetail.deleteTitle", { title: name })}
      >
        <Text>{t("imageDetail.deleteDescription")}</Text>
        <Cluster gap={2} justify="end">
          <Button isDisabled={deleting.isPending} onPress={close}>
            {t("imageDetail.cancel")}
          </Button>
          <Button
            isDisabled={deleting.data?._tag === "NotFound"}
            isPending={deleting.isPending}
            onPress={() => {
              if (isOpen) {
                failure.close();
                deleting.mutate(); // 閉じ始めた後に遅れて届いた押下では送らない
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
