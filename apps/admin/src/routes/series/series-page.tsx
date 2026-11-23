import type { ReactNode } from "react";

import { useAppContext } from "@/api/app-context";
import { useApiQuery } from "@/api/server-state/server-state";
import { QueryContent } from "@/components/query-content";
import { seriesListQuery } from "@/features/series/queries/series-query";
import { useTranslate } from "@/i18n/use-translate";
import { Center, Cluster, Stack, Text } from "@/ui/layout";
import { EmptyState, ImageThumbnail, PageHeader } from "@/ui/patterns";
import { Badge } from "@/ui/primitives/badge";
import { ActionList, ActionListRow } from "@/ui/primitives/collections";

const SeriesRows = (): ReactNode => {
  const { api } = useAppContext();
  const t = useTranslate();
  const query = useApiQuery(seriesListQuery(api));

  return (
    <QueryContent
      query={query}
      loading="list"
      level={2}
      failedTitle={t("series.loadFailed")}
    >
      {(series) =>
        series.length === 0 ? (
          <EmptyState icon="layers" title={t("series.empty")} />
        ) : (
          <ActionList>
            {series.map((entry) => (
              <li key={entry.id}>
                <ActionListRow>
                  <Cluster gap={3}>
                    <ImageThumbnail alt={entry.alt} src={entry.src} />
                    <Text>{entry.name}</Text>
                    <Badge tone={entry.published ? "success" : "neutral"}>
                      {t(
                        entry.published
                          ? "fixedPages.published"
                          : "fixedPages.unpublished",
                      )}
                    </Badge>
                  </Cluster>
                  <Text>{t("series.count", { count: entry.imageCount })}</Text>
                </ActionListRow>
              </li>
            ))}
          </ActionList>
        )
      }
    </QueryContent>
  );
};

/** シリーズの一覧。 */
export const SeriesPage = (): ReactNode => {
  const t = useTranslate();
  return (
    <Center width="form">
      <Stack gap={8}>
        <PageHeader title={t("series.title")} />
        <Stack gap={2}>
          <SeriesRows />
        </Stack>
      </Stack>
    </Center>
  );
};
