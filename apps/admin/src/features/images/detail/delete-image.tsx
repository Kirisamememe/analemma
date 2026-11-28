import { type ReactNode, useId } from "react";

import { useDeleteImage } from "./hooks/use-delete-image";

import { useTranslate } from "@/i18n/use-translate";
import { Cluster, Text } from "@/ui/layout";
import { Button } from "@/ui/primitives/button";
import { Dialog } from "@/ui/primitives/overlays";

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
  const descriptionId = useId();
  const deleting = useDeleteImage({ id, name, isDisabled, onDeleted });

  return (
    <>
      <Button
        size="sm-to-md"
        aria-label={t("imageDetail.delete")}
        icon="trash-2"
        pendingLabel={t("ui.pending")}
        isPending={deleting.isDeleting && !deleting.isConfirming}
        onPress={deleting.confirm}
      />
      <Dialog
        descriptionId={descriptionId}
        isOpen={deleting.isConfirming}
        isPending={deleting.isPending}
        onOpenChange={(open) => {
          if (!open) deleting.cancel();
        }}
        title={t("imageDetail.deleteTitle", { title: name })}
      >
        <Text>
          <span id={descriptionId}>{t("imageDetail.deleteDescription")}</span>
        </Text>
        <Cluster gap={2} justify="end">
          <Button isDisabled={deleting.isPending} onPress={deleting.cancel}>
            {t("imageDetail.cancel")}
          </Button>
          <Button
            isDisabled={deleting.isGone}
            pendingLabel={t("ui.pending")}
            isPending={deleting.isPending}
            onPress={deleting.remove}
            tone="danger"
          >
            {t("imageDetail.confirmDelete")}
          </Button>
        </Cluster>
      </Dialog>
    </>
  );
};
