import { useState } from "react";

import { useAppContext } from "@/api/app-context";
import { useApiCache, useApiMutation } from "@/api/server-state/server-state";
import { reorderFixedPages } from "@/features/fixed-pages/list/queries/fixed-page-actions";
import { FIXED_PAGES_QUERY_KEY } from "@/features/fixed-pages/queries/fixed-pages-query";
import { useTranslate } from "@/i18n/use-translate";
import { type Identified, orderItems } from "@/ui/primitives/collections";
import { useShowToast } from "@/ui/primitives/overlays";

/** 固定ページの並べ直しの状態と操作。 */
type FixedPagesReordering = {
  /** 並べ直しを送っているか。 */
  readonly isSaving: boolean;
  /** 送っている間は、送った順に並べる関数。 */
  readonly arrange: <Page extends Identified>(
    pages: readonly Page[],
  ) => readonly Page[];
  /** 並べた ID を送る関数。 */
  readonly reorder: (ids: readonly string[]) => void;
};

/** 並べ直しを送り、届くまで送った順に並べ、結果を Toast で知らせる。 */
export const useReorderFixedPages = (): FixedPagesReordering => {
  const t = useTranslate();
  const showToast = useShowToast();
  const { refresh } = useApiCache();
  const { api } = useAppContext();
  const [order, setOrder] = useState<readonly string[]>(); // 送っている並び

  const reordering = useApiMutation({
    send: (ids: readonly string[]) => reorderFixedPages(api, ids),
    onSuccess: async ({ _tag }) => {
      await refresh(FIXED_PAGES_QUERY_KEY);
      setOrder(undefined);
      showToast(
        _tag === "Reordered"
          ? { tone: "success", message: t("fixedPages.reordered") }
          : { tone: "danger", message: t("fixedPages.orderMismatch") },
      );
    },
    onError: () => {
      setOrder(undefined);
      void refresh(FIXED_PAGES_QUERY_KEY);
      showToast({ tone: "danger", message: t("fixedPages.reorderFailed") });
    },
  });

  return {
    isSaving: reordering.isPending,
    arrange: (pages) => orderItems(pages, order),
    reorder: (ids) => {
      setOrder(ids);
      reordering.mutate(ids);
    },
  };
};
