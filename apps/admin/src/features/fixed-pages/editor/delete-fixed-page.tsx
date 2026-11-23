import { type ReactNode, useRef, useState } from "react";

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

/** 固定ページを削除するボタンに渡す値。 */
type DeleteFixedPageProps = {
  /** 削除する固定ページ。 */
  page: Pick<FixedPageSummary, "id" | "title">;
  /** 削除できたときに呼ぶ関数。 */
  onDeleted: () => void;
};

/** 押すとタイトルを見せて確かめ、固定ページを削除するボタン。 */
export const DeleteFixedPage = ({
  page,
  onDeleted,
}: DeleteFixedPageProps): ReactNode => {
  const t = useTranslate();
  const showToast = useShowToast();
  const { refresh } = useApiCache();
  const { api } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null); // 画面を閉じると null になる
  const deleting = useApiMutation({
    send: () => deleteFixedPage(api, page.id),
    onSuccess: async ({ _tag }) => {
      await refresh(FIXED_PAGES_QUERY_KEY); // 一覧に戻ったとき、消したページを出さない

      if (_tag === "Deleted") {
        showToast({
          tone: "success",
          message: t("fixedPages.deleted", { title: page.title }),
        });

        if (trigger.current !== null) onDeleted(); // 画面を閉じていたら、移った先の画面から動かさない
      }
    },
    onError: () => {
      void refresh(FIXED_PAGES_QUERY_KEY); // 削除できてから応答だけが失敗したときも、一覧を合わせる
    },
  });
  const close = (): void => {
    setIsOpen(false);
  };

  return (
    <>
      <Button
        aria-label={t("fixedPageEditor.delete")}
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
        title={t("fixedPages.deleteTitle", { title: page.title })}
      >
        <Text>{t("fixedPages.deleteDescription")}</Text>
        {deleting.isError && (
          <Notice tone="danger">{t("fixedPages.deleteFailed")}</Notice>
        )}
        {deleting.data?._tag === "NotFound" && (
          <Notice tone="warning">{t("fixedPageEditor.pageGone")}</Notice>
        )}
        <Cluster gap={2} justify="end">
          <Button isDisabled={deleting.isPending} onPress={close}>
            {t("fixedPages.cancel")}
          </Button>
          <Button
            isDisabled={deleting.data?._tag === "NotFound"}
            isPending={deleting.isPending}
            onPress={() => {
              if (isOpen) {
                deleting.mutate(); // 閉じ始めた後に遅れて届いた押下では送らない
              }
            }}
            tone="danger"
          >
            {t("fixedPages.delete")}
          </Button>
        </Cluster>
      </Dialog>
    </>
  );
};
