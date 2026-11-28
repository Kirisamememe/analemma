import { type ReactNode, useRef, useState } from "react";

import { useAppContext } from "@/api/app-context";
import { useApiCache, useApiMutation } from "@/api/server-state/server-state";
import { deleteFixedPage } from "@/features/fixed-pages/editor/queries/delete-fixed-page";
import {
  FIXED_PAGES_QUERY_KEY,
  type FixedPageSummary,
} from "@/features/fixed-pages/queries/fixed-pages-query";
import { useTranslate } from "@/i18n/use-translate";
import { Cluster, Text } from "@/ui/layout";
import { Button } from "@/ui/primitives/button";
import {
  Dialog,
  useFailureToast,
  useShowToast,
} from "@/ui/primitives/overlays";

/** 固定ページを削除するボタンに渡す値。 */
type DeleteFixedPageProps = {
  /** 削除する固定ページ。 */
  page: Pick<FixedPageSummary, "id" | "title">;
  /** 削除できたときに呼ぶ関数。 */
  onDeleted: () => void;
  /** 確認を開いたときと閉じたときに呼ぶ関数。 */
  onOpenChange?: (open: boolean) => void;
  /** 削除のボタンを押せないか。 */
  isDisabled?: boolean;
};

/** 押すとタイトルを見せて確かめ、固定ページを削除するボタン。 */
export const DeleteFixedPage = ({
  page,
  onDeleted,
  onOpenChange,
  isDisabled = false,
}: DeleteFixedPageProps): ReactNode => {
  const t = useTranslate();
  const showToast = useShowToast();
  const failure = useFailureToast();
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
      } else {
        failure.show(t("fixedPageEditor.pageGone"));
      }
    },
    onError: () => {
      failure.show(t("fixedPages.deleteFailed"));
      void refresh(FIXED_PAGES_QUERY_KEY); // 削除できてから応答だけが失敗したときも、一覧を合わせる
    },
  });

  const open = (): void => {
    deleting.reset(); // 開き直したら、前の送信の結果を消す
    setIsOpen(true);
    onOpenChange?.(true);
  };

  const close = (): void => {
    failure.close();
    setIsOpen(false);
    onOpenChange?.(false);
  };

  const submit = (): void => {
    if (!isOpen) return; // 閉じ始めた後に遅れて届いた押下では送らない

    failure.close();
    deleting.mutate();
  };

  return (
    <>
      <Button
        aria-label={t("fixedPageEditor.delete")}
        icon="trash-2"
        isDisabled={isDisabled}
        ref={trigger}
        onPress={open}
      />
      <Dialog
        isOpen={isOpen}
        isPending={deleting.isPending}
        onOpenChange={(isShown) => {
          if (!isShown) close();
        }}
        title={t("fixedPages.deleteTitle", { title: page.title })}
      >
        <Text>{t("fixedPages.deleteDescription")}</Text>
        <Cluster gap={2} justify="end">
          <Button isDisabled={deleting.isPending} onPress={close}>
            {t("fixedPages.cancel")}
          </Button>
          <Button
            isDisabled={deleting.data?._tag === "NotFound"}
            isPending={deleting.isPending}
            onPress={submit}
            tone="danger"
          >
            {t("fixedPages.delete")}
          </Button>
        </Cluster>
      </Dialog>
    </>
  );
};
