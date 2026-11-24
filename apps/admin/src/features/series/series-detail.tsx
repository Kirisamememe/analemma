import { type ReactNode, useId } from "react";

import { useSeriesDetail } from "./hooks/use-series-detail";
import type { Series } from "./queries/series-query";
import { SeriesForm } from "./series-form";

import { useTranslate } from "@/i18n/use-translate";
import { Cluster, Stack, Text } from "@/ui/layout";
import { PageHeader } from "@/ui/patterns";
import { Badge } from "@/ui/primitives/badge";
import { Button } from "@/ui/primitives/button";
import { Dialog } from "@/ui/primitives/overlays";

type SeriesDetailProps = {
  /** 取得したシリーズ。 */
  series: Series;
  /** 削除後に一覧へ戻る。 */
  onDeleted: () => void;
};

/** シリーズの情報の編集・公開の切り替え・削除。 */
export const SeriesDetail = ({
  series,
  onDeleted,
}: SeriesDetailProps): ReactNode => {
  const t = useTranslate();
  const detail = useSeriesDetail(series, onDeleted);

  const {
    dialog,
    openDialog,
    pending,
    isSaving,
    isPending,
    closeDialog,
    change,
  } = detail;

  const descriptionId = useId();
  const title = series.name;

  return (
    <Stack gap={6}>
      <PageHeader title={title} description={series.description ?? undefined} />
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
          isDisabled={isPending}
          onPress={() => {
            openDialog("edit");
          }}
        >
          {t("series.edit")}
        </Button>
        <Button
          isDisabled={isPending}
          isPending={
            pending?.action === "publish" || pending?.action === "unpublish"
          }
          onPress={() => {
            change({ action: series.published ? "unpublish" : "publish" });
          }}
        >
          {t(series.published ? "fixedPages.unpublish" : "fixedPages.publish")}
        </Button>
        <Button
          isDisabled={isPending}
          tone="danger"
          onPress={() => {
            openDialog("delete");
          }}
        >
          {t("fixedPages.delete")}
        </Button>
      </Cluster>
      {dialog === "edit" && (
        <SeriesForm series={series} onClose={closeDialog} />
      )}
      {dialog === "delete" && (
        <Dialog
          isOpen
          isPending={isPending}
          descriptionId={descriptionId}
          title={t("fixedPages.deleteTitle", { title })}
          onOpenChange={(open) => {
            if (!open) closeDialog();
          }}
        >
          <Text>
            <span id={descriptionId}>{t("series.deleteDescription")}</span>
          </Text>
          <Cluster gap={2}>
            <Button isDisabled={isPending} onPress={closeDialog}>
              {t("fixedPages.cancel")}
            </Button>
            <Button
              isPending={isPending}
              tone="danger"
              onPress={() => {
                change({ action: "delete" });
              }}
            >
              {t("fixedPages.delete")}
            </Button>
          </Cluster>
        </Dialog>
      )}
    </Stack>
  );
};
