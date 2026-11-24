import { memo, type ReactNode, useCallback } from "react";

import type { useSeriesDetail } from "./hooks/use-series-detail";
import { seriesImageLabel } from "./logic/series-image-label";
import type { Series } from "./queries/series-query";

import { ImagePicker } from "@/components/images/image-picker";
import { useLocale, useTranslate } from "@/i18n/use-translate";
import { Cluster, Heading, Stack, Text } from "@/ui/layout";
import { EmptyState, ImageThumbnail } from "@/ui/patterns";
import { Badge } from "@/ui/primitives/badge";
import { Button } from "@/ui/primitives/button";
import {
  ActionListRow,
  ReorderableList,
  orderItems,
} from "@/ui/primitives/collections";

type ImageRowProps = Pick<
  Series["images"][number],
  "id" | "alt" | "src" | "published"
> & {
  /** 行と画像に付ける名前。 */
  label: string;
  /** この画像を外しているか。 */
  removing: boolean;
  /** この画像をシリーズから外す。 */
  onRemove: (id: string) => void;
};

const ImageRowContent = ({
  id,
  label,
  src,
  alt,
  published,
  removing,
  onRemove,
}: ImageRowProps): ReactNode => {
  const t = useTranslate();
  return (
    <ActionListRow card>
      <Cluster gap={2}>
        <ImageThumbnail src={src} alt={alt} />
        <Text>{label}</Text>
        {!published && <Badge tone="neutral">{t("images.unpublished")}</Badge>}
      </Cluster>
      <Button
        size="sm"
        isPending={removing}
        aria-label={t("series.remove", { title: label })}
        icon="x"
        onPress={() => {
          onRemove(id);
        }}
      />
    </ActionListRow>
  );
};

const ImageRow = memo(ImageRowContent);

type SeriesImagesProps = {
  /** シリーズに入っている画像。 */
  images: Series["images"];
  /** 詳細の画面から送った操作とその状態。 */
  detail: ReturnType<typeof useSeriesDetail>;
};

/** シリーズの画像の一覧と画像を追加する Dialog。 */
export const SeriesImages = ({
  images,
  detail,
}: SeriesImagesProps): ReactNode => {
  const t = useTranslate();
  const locale = useLocale();

  const {
    change,
    pending,
    isPending,
    order,
    missing,
    dialog,
    closeDialog,
    focusAdd,
    openDialog,
  } = detail;

  const remove = useCallback(
    (id: string) => {
      change({ action: "removeImages", imageIds: [id] });
    },
    [change],
  );

  const reorder = useCallback(
    (imageIds: readonly string[]) => {
      change({ action: "reorder", imageIds });
    },
    [change],
  );

  return (
    <Stack gap={2}>
      <Cluster gap={2} justify="between">
        <Heading level={2}>{t("images.title")}</Heading>
        <Button
          ref={focusAdd}
          isDisabled={isPending}
          onPress={() => {
            openDialog("picker");
          }}
        >
          {t("series.add")}
        </Button>
      </Cluster>
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
            areActionsDisabled={isPending}
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
                    id={image.id}
                    src={image.src}
                    alt={image.alt}
                    published={image.published}
                    label={label}
                    removing={
                      pending?.action === "removeImages" &&
                      pending.imageIds.includes(image.id)
                    }
                    onRemove={remove}
                  />
                ),
              };
            })}
          />
        </>
      )}
      {dialog === "picker" && (
        <ImagePicker
          mode="multiple"
          missing={missing}
          included={new Set(images.map(({ id }) => id))}
          isPending={isPending}
          onConfirm={(selected) => {
            change({
              action: "addImages",
              imageIds: selected.map(({ id }) => id),
            });
          }}
          onClose={closeDialog}
        />
      )}
    </Stack>
  );
};
