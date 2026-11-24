import { useParams } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { useAppContext } from "@/api/app-context";
import { useApiQuery } from "@/api/server-state/server-state";
import { QueryContent } from "@/components/query-content";
import { seriesDetailQuery } from "@/features/series/queries/series-query";
import { SeriesDetail } from "@/features/series/series-detail";
import { useTranslate } from "@/i18n/use-translate";
import { Center, Stack } from "@/ui/layout";
import { Link } from "@/ui/primitives/navigation";
import { Notice } from "@/ui/primitives/notice";

/** シリーズの情報を編集する画面。 */
export const SeriesDetailPage = (): ReactNode => {
  const t = useTranslate();
  const { api } = useAppContext();
  const { id } = useParams({ from: "/signed-in/series/$id" });
  const query = useApiQuery(seriesDetailQuery(api, id));

  return (
    <Center width="form">
      <Stack gap={4}>
        <Link href="/series" variant="back">
          {t("series.back")}
        </Link>
        <QueryContent
          query={query}
          loading="form"
          level={2}
          failedTitle={t("series.loadFailed")}
        >
          {(series) =>
            series === null ? (
              <Notice tone="warning">{t("series.gone")}</Notice>
            ) : (
              <SeriesDetail key={series.id} series={series} />
            )
          }
        </QueryContent>
      </Stack>
    </Center>
  );
};
