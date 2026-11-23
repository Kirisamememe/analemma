import { memo, type ReactNode, useCallback } from "react";

import type { useSeriesDetail } from "./hooks/use-series-detail";
import { seriesImageLabel } from "./logic/series-image-label";
import type { Series } from "./queries/series-query";

import { useLocale, useTranslate } from "@/i18n/use-translate";
import { Cluster, Heading, Stack, Text } from "@/ui/layout";
import { EmptyState, ImageThumbnail } from "@/ui/patterns";
import { Badge } from "@/ui/primitives/badge";
import { ReorderableList, orderItems } from "@/ui/primitives/collections";

type ImageRowProps = Pick<
  Series["images"][number],
  "alt" | "src" | "published"
> & {
  /** 行と画像に付ける名前。 */
  label: string;
};

const ImageRowContent = ({
  label,
  src,
  alt,
  published,
}: ImageRowProps): ReactNode => {
  const t = useTranslate();
  return (
    <Cluster gap={2}>
      <ImageThumbnail src={src} alt={alt} />
      <Text>{label}</Text>
      {!published && <Badge tone="neutral">{t("images.unpublished")}</Badge>}
    </Cluster>
  );
};

const ImageRow = memo(ImageRowContent);

type SeriesImagesProps = {
  /** シリーズに入っている画像。 */
  images: Series["images"];
  /** 詳細の画面から送った操作とその状態。 */
  detail: ReturnType<typeof useSeriesDetail>;
};

/** シリーズの画像を並べ直す一覧。 */
export const SeriesImages = ({
  images,
  detail,
}: SeriesImagesProps): ReactNode => {
  const t = useTranslate();
  const locale = useLocale();

  const { change, isPending, order } = detail;

  const reorder = useCallback(
    (imageIds: readonly string[]) => {
      change({ action: "reorder", imageIds });
    },
    [change],
  );

  return (
    <Stack gap={2}>
      <Heading level={2}>{t("images.title")}</Heading>
      {images.length === 0 ? (
        <EmptyState icon="image" title={t("series.noImages")} />
      ) : (
        <>
          {images.length > 1 && (
            <Text variant="caption">{t("fixedPages.reorderHint")}</Text>
          )}
          <output>{order !== undefined && t("fixedPages.savingOrder")}</output>
          <ReorderableList
            label={t("images.title")}
            isDisabled={isPending}
            onReorder={reorder}
            items={orderItems(images, order).map((image, index) => {
              const label = seriesImageLabel(image, {
                position: index + 1,
                locale,
                t,
              });

              return {
                id: image.id,
                textValue: label,
                children: (
                  <ImageRow
                    src={image.src}
                    alt={image.alt}
                    published={image.published}
                    label={label}
                  />
                ),
              };
            })}
          />
        </>
      )}
    </Stack>
  );
};
