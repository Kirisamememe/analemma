import type { ReactNode } from "react";

import { useAppContext } from "@/api/app-context";
import { useApiCache, useApiMutation } from "@/api/server-state/server-state";
import { setPublication } from "@/features/fixed-pages/list/fixed-page-actions";
import {
  FIXED_PAGES_QUERY_KEY,
  type FixedPageSummary,
} from "@/features/fixed-pages/list/fixed-pages-query";
import { formatDateTime } from "@/i18n/format-date-time";
import { useLocale, useTranslate } from "@/i18n/use-translate";
import { Cluster, Stack, Text } from "@/ui/layout";
import { Badge } from "@/ui/primitives/badge";
import { Button } from "@/ui/primitives/button";
import { useShowToast } from "@/ui/primitives/overlays";

const DONE = {
  Published: "fixedPages.publishDone",
  Unpublished: "fixedPages.unpublishDone",
  NotFound: "fixedPages.gone",
} as const;

/** 固定ページの一覧の1行に渡す値。 */
type FixedPageRowProps = {
  /** 行の固定ページ。 */
  readonly page: FixedPageSummary;
  /** 種類のラベル。 */
  readonly kindLabel: string;
  /** 削除を始める関数。 */
  readonly onDelete: (page: FixedPageSummary) => void;
};

/** 固定ページの一覧の1行(タイトル・公開状態・slug・種類・更新日時と、操作)。 */
export const FixedPageRow = ({
  page,
  kindLabel,
  onDelete,
}: FixedPageRowProps): ReactNode => {
  const t = useTranslate();
  const locale = useLocale();
  const showToast = useShowToast();
  const { refresh } = useApiCache();
  const { api } = useAppContext();
  const { title } = page;
  const publication = useApiMutation({
    send: () =>
      setPublication(api, { id: page.id, published: !page.published }),
    onSuccess: async ({ _tag }) => {
      await refresh(FIXED_PAGES_QUERY_KEY);
      showToast({
        tone: _tag === "NotFound" ? "danger" : "success",
        message: t(DONE[_tag], { title }),
      });
    },
    onError: () => {
      showToast({
        tone: "danger",
        message: t("fixedPages.publicationFailed", { title }),
      });
    },
  });

  return (
    <Cluster align="center" gap={3} justify="between">
      <Stack gap={0.5}>
        <Cluster gap={2}>
          <Text as="span" variant="label">
            {title}
          </Text>
          <Badge tone={page.published ? "success" : "neutral"}>
            {t(
              page.published
                ? "fixedPages.published"
                : "fixedPages.unpublished",
            )}
          </Badge>
        </Cluster>
        <Text tone="muted" variant="caption">
          {t("fixedPages.details", {
            slug: page.slug,
            kind: kindLabel,
            updated: formatDateTime(locale, page.updatedAt),
          })}
        </Text>
      </Stack>
      <Cluster gap={2}>
        <Button
          isPending={publication.isPending}
          onPress={() => {
            publication.mutate();
          }}
          size="sm"
        >
          {t(page.published ? "fixedPages.unpublish" : "fixedPages.publish")}
        </Button>
        <Button
          onPress={() => {
            onDelete(page);
          }}
          size="sm"
          tone="danger"
        >
          {t("fixedPages.delete")}
        </Button>
      </Cluster>
    </Cluster>
  );
};
