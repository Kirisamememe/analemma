import { useLocation } from "@tanstack/react-router";
import { type ReactNode, useCallback, useRef, useState } from "react";

import { useAppContext } from "@/api/app-context";
import { useApiQuery } from "@/api/server-state/server-state";
import { QueryContent } from "@/components/query-content";
import { seriesListQuery } from "@/features/series/queries/series-query";
import { SeriesForm } from "@/features/series/series-form";
import { useTranslate } from "@/i18n/use-translate";
import { Center, Cluster, Stack, Text } from "@/ui/layout";
import { EmptyState, ImageThumbnail, PageHeader } from "@/ui/patterns";
import { Badge } from "@/ui/primitives/badge";
import { Button } from "@/ui/primitives/button";
import { ActionList, ActionListRow } from "@/ui/primitives/collections";
import { Icon } from "@/ui/primitives/graphics";
import { Link } from "@/ui/primitives/navigation";

const CreateSeries = (): ReactNode => {
  const t = useTranslate();
  const [creating, setCreating] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);

  const focusCreate = useLocation({
    select: (location) => location.hash === "new-series",
  });

  const attach = useCallback(
    (button: HTMLButtonElement | null) => {
      trigger.current = button;

      if (!focusCreate || button === null) return;

      const frame = requestAnimationFrame(() => {
        button.focus();
      });

      return () => {
        cancelAnimationFrame(frame);
      };
    },
    [focusCreate],
  );

  return (
    <>
      <div id="new-series">
        <Button
          ref={attach}
          size="card"
          tone="dashed"
          onPress={() => {
            setCreating(true);
          }}
        >
          <Icon name="plus" />
          {t("series.new")}
        </Button>
      </div>
      {creating && (
        <SeriesForm
          onClose={() => {
            setCreating(false);
            trigger.current?.focus();
          }}
        />
      )}
    </>
  );
};

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
                    <Link href={`/series/${entry.id}`}>{entry.name}</Link>
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
          <CreateSeries />
          <SeriesRows />
        </Stack>
      </Stack>
    </Center>
  );
};
