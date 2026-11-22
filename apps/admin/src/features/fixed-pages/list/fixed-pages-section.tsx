import { type ReactNode, useState } from "react";

import { useAppContext } from "@/api/app-context";
import {
  useApiCache,
  useApiMutation,
  useApiQuery,
} from "@/api/server-state/server-state";
import { DeleteFixedPageDialog } from "@/features/fixed-pages/list/delete-fixed-page-dialog";
import { reorderFixedPages } from "@/features/fixed-pages/list/fixed-page-actions";
import { FixedPageRow } from "@/features/fixed-pages/list/fixed-page-row";
import {
  FIXED_PAGES_QUERY_KEY,
  type FixedPageSummary,
  KINDS_QUERY_KEY,
} from "@/features/fixed-pages/list/fixed-pages-query";
import { orderPages } from "@/features/fixed-pages/list/order-pages";
import { useTranslate } from "@/i18n/use-translate";
import { Cluster, Stack, Text } from "@/ui/layout";
import { EmptyState } from "@/ui/patterns";
import { ReorderableList } from "@/ui/primitives/collections";
import { Spinner } from "@/ui/primitives/graphics";
import { Notice } from "@/ui/primitives/notice";
import { FocusScope, useShowToast } from "@/ui/primitives/overlays";

/** 固定ページの一覧と、並べ直し・公開と非公開・削除の操作。 */
export const FixedPagesSection = (): ReactNode => {
  const t = useTranslate();
  const showToast = useShowToast();
  const { refresh } = useApiCache();
  const { api } = useAppContext();
  const [order, setOrder] = useState<readonly string[]>(); // 送っている並び。届くまで、この順に並べる
  const [deleting, setDeleting] = useState<FixedPageSummary>(); // 閉じても持ち、閉じる animation の間も出す
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [openCount, setOpenCount] = useState(0); // Dialog の key。開くたびに前の送信の結果を消す
  const pages = useApiQuery({
    key: FIXED_PAGES_QUERY_KEY,
    load: () => api.admin.fixedPages.list(),
  });
  const kinds = useApiQuery({
    key: KINDS_QUERY_KEY,
    load: () => api.admin.kinds.list(),
  });
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

  const renderPages = (): ReactNode => {
    if (pages._tag === "Loading" || kinds._tag === "Loading") {
      return <Text tone="muted">{t("fixedPages.loading")}</Text>;
    }

    if (pages._tag === "Failed") {
      return <Notice tone="danger">{t("fixedPages.loadFailed")}</Notice>;
    }

    const labels = new Map(
      kinds._tag === "Loaded"
        ? kinds.data.kinds.map(({ name, label }) => [name, label])
        : [],
    );
    const rows = orderPages(pages.data.pages, order);

    if (rows.length === 0) {
      return (
        <EmptyState
          description={t("fixedPages.emptyDescription")}
          icon="file-text"
          title={t("fixedPages.emptyTitle")}
        />
      );
    }

    return (
      <>
        {rows.length > 1 && (
          <Cluster align="center" gap={2} justify="between">
            <Text tone="muted" variant="caption">
              {t("fixedPages.reorderHint")}
            </Text>
            <output>
              {reordering.isPending && (
                <Cluster align="center" gap={1.5}>
                  <Spinner />
                  <Text as="span" tone="muted" variant="caption">
                    {t("fixedPages.savingOrder")}
                  </Text>
                </Cluster>
              )}
            </output>
          </Cluster>
        )}
        <ReorderableList
          isDisabled={reordering.isPending}
          items={rows.map((page) => ({
            id: page.id,
            textValue: page.title,
            children: (
              <FixedPageRow
                kindLabel={labels.get(page.kind) ?? page.kind}
                onDelete={(selected) => {
                  setDeleting(selected);
                  setIsDeleteOpen(true);
                  setOpenCount((count) => count + 1);
                }}
                page={page}
              />
            ),
          }))}
          label={t("fixedPages.title")}
          onReorder={(ids) => {
            setOrder(ids);
            reordering.mutate(ids);
          }}
        />
      </>
    );
  };

  return (
    <FocusScope>
      <Stack gap={3}>
        {renderPages()}
        {deleting !== undefined && (
          <DeleteFixedPageDialog
            isOpen={isDeleteOpen}
            key={openCount}
            onClose={() => {
              setIsDeleteOpen(false);
            }}
            page={deleting}
          />
        )}
      </Stack>
    </FocusScope>
  );
};
