import type { ReactNode } from "react";

import { useAppContext } from "@/api/app-context";
import { useApiCache, useApiMutation } from "@/api/server-state/server-state";
import { deleteFixedPage } from "@/features/fixed-pages/list/fixed-page-actions";
import {
  FIXED_PAGES_QUERY_KEY,
  type FixedPageSummary,
} from "@/features/fixed-pages/list/fixed-pages-query";
import { useTranslate } from "@/i18n/use-translate";
import { Cluster, Text } from "@/ui/layout";
import { Button } from "@/ui/primitives/button";
import { Notice } from "@/ui/primitives/notice";
import { Dialog, useShowToast } from "@/ui/primitives/overlays";

/** 固定ページを削除する Dialog に渡す値。 */
type DeleteFixedPageDialogProps = {
  /** 開いているか。 */
  isOpen: boolean;
  /** 削除する固定ページ。 */
  page: FixedPageSummary;
  /** 閉じる関数。 */
  onClose: () => void;
};

/** タイトルを見せて確かめてから、固定ページを削除する Dialog。 */
export const DeleteFixedPageDialog = ({
  isOpen,
  page,
  onClose,
}: DeleteFixedPageDialogProps): ReactNode => {
  const t = useTranslate();
  const showToast = useShowToast();
  const { refresh } = useApiCache();
  const { api } = useAppContext();
  const deleting = useApiMutation({
    send: () => deleteFixedPage(api, page.id),
    onSuccess: async ({ _tag }) => {
      await refresh(FIXED_PAGES_QUERY_KEY);

      if (_tag === "Deleted") {
        onClose();
        showToast({
          tone: "success",
          message: t("fixedPages.deleted", { title: page.title }),
        });
      }
    },
  });

  return (
    <Dialog
      isOpen={isOpen}
      isPending={deleting.isPending}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      title={t("fixedPages.deleteTitle", { title: page.title })}
    >
      <Text>{t("fixedPages.deleteDescription")}</Text>
      {deleting.isError && (
        <Notice tone="danger">{t("fixedPages.deleteFailed")}</Notice>
      )}
      {deleting.data?._tag === "NotFound" && (
        <Notice tone="warning">{t("fixedPages.notFound")}</Notice>
      )}
      <Cluster gap={2} justify="end">
        <Button isDisabled={deleting.isPending} onPress={onClose}>
          {t("fixedPages.cancel")}
        </Button>
        <Button
          isDisabled={deleting.data?._tag === "NotFound"}
          isPending={deleting.isPending}
          onPress={() => {
            deleting.mutate();
          }}
          tone="danger"
        >
          {t("fixedPages.delete")}
        </Button>
      </Cluster>
    </Dialog>
  );
};
