import { memo, type ReactNode } from "react";

import { toShotInfo } from "./logic/shot-info";

import type { ApiOutputs } from "@/api/api-types";
import { ImageViewer, type Neighbor } from "@/features/images/ui/image-viewer";
import { InfoList } from "@/features/images/ui/info-list";
import { formatDateTime } from "@/i18n/format-date-time";
import { useLocale, useTranslate } from "@/i18n/use-translate";
import { Cluster, Heading, Stack, Text } from "@/ui/layout";
import { Badge } from "@/ui/primitives/badge";
import type { AppHref } from "@/ui/primitives/ui-provider";

type Image = ApiOutputs["admin"]["images"]["get"];

/** 写真を見る画面に渡す値。 */
type ImageDetailProps = {
  /** 前後の写真の取得に失敗したときの案内。 */
  navigationError?: ReactNode;
  /** 画像を取り直せなかったときの表示。 */
  error?: ReactNode;
  /** 見る画像。 */
  image: Image;
  /** 読み込んでいる次の写真。 */
  pending?: Image | undefined;
  /** 写真や情報の取得を待つ間の案内。 */
  waiting?: string | undefined;
  /** 写真を送った向き。 */
  direction?: "previous" | "next" | undefined;
  /** 次の写真を表示する準備が整ったときに呼ぶ関数。 */
  onSettled?: ((id: string) => void) | undefined;
  /** 前の画像を見る画面(無ければ undefined)。 */
  previous: Neighbor | undefined;
  /** 次の画像を見る画面(無ければ undefined)。 */
  next: Neighbor | undefined;
  /** 前後の画像を見る画面に移る関数(スワイプで移るとき)。 */
  onMove: (href: AppHref) => void;
};

type ImageInfoProps = Pick<ImageDetailProps, "image" | "navigationError">;

const ImageInfoContent = ({
  image,
  navigationError,
}: ImageInfoProps): ReactNode => {
  const t = useTranslate();
  const locale = useLocale();
  const name = image.title ?? t("imageDetail.untitled");
  const shot = toShotInfo(image, { locale, t });

  const texts = [
    { label: t("imageDetail.description"), value: image.description },
    { label: t("imageDetail.alt"), value: image.alt },
  ].flatMap(({ label, value }) => (value === null ? [] : [{ label, value }]));

  return (
    <>
      <Stack gap={2}>
        <Heading level={1}>{name}</Heading>
        <Cluster align="center" gap={2}>
          <Badge tone={image.published ? "success" : "neutral"}>
            {t(
              image.published
                ? "imageDetail.published"
                : "imageDetail.unpublished",
            )}
          </Badge>
          <Text as="span" tone="muted" variant="caption">
            {t("imageDetail.added", {
              date: formatDateTime(locale, image.createdAt),
            })}
          </Text>
        </Cluster>
      </Stack>
      {navigationError}
      {texts.length > 0 && <InfoList items={texts} layout="stacked" />}
      <Stack gap={3}>
        <Heading level={2}>{t("imageDetail.shotHeading")}</Heading>
        {shot.length === 0 ? (
          <Text tone="muted">{t("imageDetail.noShotInfo")}</Text>
        ) : (
          <InfoList
            items={shot.map(({ label, value }) => ({
              label: t(label),
              value,
            }))}
            layout="columns"
          />
        )}
      </Stack>
    </>
  );
};

const ImageInfo = memo(ImageInfoContent);

/** 1枚の画像を大きく出し、その情報を添える。 */
export const ImageDetail = ({
  image,
  navigationError,
  error,
  pending,
  waiting,
  direction,
  onSettled,
  previous,
  next,
  onMove,
}: ImageDetailProps): ReactNode => {
  const t = useTranslate();

  const altFor = (photo: Image) =>
    photo.alt ?? photo.title ?? t("imageDetail.untitled");

  return (
    <ImageViewer
      photoId={image.id}
      alt={altFor(image)}
      pending={
        pending === undefined
          ? undefined
          : {
              id: pending.id,
              images: pending.deliveryImages,
              alt: altFor(pending),
            }
      }
      direction={direction}
      waiting={waiting}
      onSettled={onSettled}
      images={image.deliveryImages}
      missing={t("images.noDeliveryImage")}
      next={next}
      onSwipe={(side) => {
        const target = side === "previous" ? previous : next;

        if (target !== undefined && target.disabled !== true) {
          onMove(target.href);
        }
      }}
      previous={previous}
    >
      <ImageInfo image={image} navigationError={navigationError} />
      {error}
    </ImageViewer>
  );
};
