import { type ReactNode, useState } from "react";

import { seriesSaveKey, type Series } from "./queries/series-query";
import { SeriesForm } from "./series-form";

import { useIsApiMutationPending } from "@/api/server-state/server-state";
import { useTranslate } from "@/i18n/use-translate";
import { Cluster, Stack, Text } from "@/ui/layout";
import { PageHeader } from "@/ui/patterns";
import { Badge } from "@/ui/primitives/badge";
import { Button } from "@/ui/primitives/button";

type SeriesDetailProps = {
  /** 表示するシリーズ。 */
  series: Series;
};

/** シリーズの情報と編集の Dialog。 */
export const SeriesDetail = ({ series }: SeriesDetailProps): ReactNode => {
  const t = useTranslate();
  const [editing, setEditing] = useState(false);
  const isSaving = useIsApiMutationPending(seriesSaveKey(series.id));

  return (
    <Stack gap={6}>
      <PageHeader
        title={series.name}
        description={series.description ?? undefined}
      />
      <Cluster gap={2}>
        <Text>{series.slug}</Text>
        <Badge tone={series.published ? "success" : "neutral"}>
          {t(
            series.published
              ? "fixedPages.published"
              : "fixedPages.unpublished",
          )}
        </Badge>
      </Cluster>
      <Cluster gap={2}>
        <Button
          isPending={isSaving}
          onPress={() => {
            setEditing(true);
          }}
        >
          {t("series.edit")}
        </Button>
      </Cluster>
      {editing && (
        <SeriesForm
          series={series}
          onClose={() => {
            setEditing(false);
          }}
        />
      )}
    </Stack>
  );
};
