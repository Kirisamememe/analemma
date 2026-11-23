import type { ReactNode } from "react";

import { KindRefreshNotice } from "./kind-refresh-notice";

import { useAppContext } from "@/api/app-context";
import { useApiQuery } from "@/api/server-state/server-state";
import { FixedPageRow } from "@/features/fixed-pages/list/fixed-page-row";
import { useReorderFixedPages } from "@/features/fixed-pages/list/hooks/use-reorder-fixed-pages";
import {
  FIXED_PAGES_QUERY_KEY,
  KIND_STALE_TIME,
  KINDS_QUERY_KEY,
  loadFixedPages,
  loadKinds,
} from "@/features/fixed-pages/queries/fixed-pages-query";
import { useTranslate } from "@/i18n/use-translate";
import { Cluster, Stack, Text } from "@/ui/layout";
import { EmptyState, ErrorState, LoadingState } from "@/ui/patterns";
import { Button } from "@/ui/primitives/button";
import { ReorderableList } from "@/ui/primitives/collections";
import { Icon, Spinner } from "@/ui/primitives/graphics";

/** 固定ページの一覧に渡す値。 */
type FixedPagesSectionProps = {
  /** 固定ページの編集の画面を開く関数。 */
  onEdit: (id: string) => void;
  /** 固定ページの作成の画面を開く関数。 */
  onCreate: () => void;
};

/** 固定ページの一覧と、並べ直し・公開と非公開の操作。 */
export const FixedPagesSection = ({
  onEdit,
  onCreate,
}: FixedPagesSectionProps): ReactNode => {
  const t = useTranslate();
  const { api } = useAppContext();
  const reordering = useReorderFixedPages();

  const pages = useApiQuery({
    key: FIXED_PAGES_QUERY_KEY,
    load: () => loadFixedPages(api),
  });

  const kinds = useApiQuery({
    key: KINDS_QUERY_KEY,
    tabStaleTime: KIND_STALE_TIME,
    load: () => loadKinds(api),
  });

  const kindsRetrying = kinds._tag === "Failed" && kinds.isRetrying;

  const rows =
    pages._tag === "Loaded" ? reordering.arrange(pages.data.pages) : [];

  const showRows =
    pages._tag === "Loaded" && kinds._tag !== "Loading" && !kindsRetrying;

  const labels = new Map(
    kinds._tag === "Loaded"
      ? kinds.data.kinds.map(({ name, label }) => [name, label])
      : [],
  );

  const content = (): ReactNode => {
    if (pages._tag === "Loading" || kinds._tag === "Loading") {
      return <LoadingState layout="list" />;
    }

    if (pages._tag === "Failed") {
      return (
        <ErrorState
          isRetrying={pages.isRetrying || kindsRetrying}
          layout="inline"
          level={2}
          onRetry={() => {
            pages.retry();

            if (kinds._tag === "Failed") kinds.retry(); // 種類のラベルも読めていなければ、一緒に取り直す
          }}
          title={t("fixedPages.loadFailed")}
        />
      );
    }

    if (kindsRetrying) return <LoadingState layout="list" />;

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
      <ReorderableList
        isDisabled={reordering.isSaving}
        items={rows.map((page) => ({
          id: page.id,
          textValue: page.title,
          children: (
            <FixedPageRow
              kindLabel={labels.get(page.kind) ?? page.kind}
              onEdit={onEdit}
              page={page}
            />
          ),
        }))}
        label={t("fixedPages.title")}
        onReorder={reordering.reorder}
      />
    );
  };

  return (
    <Stack gap={2}>
      <Button size="card" tone="dashed" onPress={onCreate}>
        <Icon name="plus" />
        {t("fixedPages.create")}
      </Button>
      {showRows && rows.length > 1 && (
        <Cluster align="center" gap={2} justify="between">
          <Text tone="muted" variant="caption">
            {t("fixedPages.reorderHint")}
          </Text>
          <output>
            {reordering.isSaving && (
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
      {kinds._tag === "Loaded" && kinds.refreshFailure !== undefined && (
        <KindRefreshNotice
          source="list"
          refreshFailure={kinds.refreshFailure}
        />
      )}
      {content()}
    </Stack>
  );
};
