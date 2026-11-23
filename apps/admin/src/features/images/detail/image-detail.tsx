import type { ReactNode } from "react";

import { toShotInfo } from "./logic/shot-info";

import type { ApiOutputs } from "@/api/api-types";
import { ImageViewer } from "@/features/images/ui/image-viewer";
import { InfoList } from "@/features/images/ui/info-list";
import { formatDateTime } from "@/i18n/format-date-time";
import { useLocale, useTranslate } from "@/i18n/use-translate";
import { Cluster, Heading, Stack, Text } from "@/ui/layout";
import { Badge } from "@/ui/primitives/badge";
import type { AppHref } from "@/ui/primitives/ui-provider";

type Image = ApiOutputs["admin"]["images"]["get"];

/** 写真を見る画面に渡す値。 */
type ImageDetailProps = {
  /** 見る画像。 */
  image: Image;
  /** 帯の左に置く、一覧へ戻るリンク。 */
  back: ReactNode;
  /** 前の画像を見る画面(無ければ undefined)。 */
  previous: AppHref | undefined;
  /** 次の画像を見る画面(無ければ undefined)。 */
  next: AppHref | undefined;
  /** 前後の画像を見る画面に移る関数(スワイプで移るとき)。 */
  onMove: (href: AppHref) => void;
};

/** 1枚の画像を大きく出し、横に情報を置く。 */
export const ImageDetail = ({
  image,
  back,
  previous,
  next,
  onMove,
}: ImageDetailProps): ReactNode => {
  const t = useTranslate();
  const locale = useLocale();
  const name = image.title ?? t("imageDetail.untitled");
  const shot = toShotInfo(image, { locale, t });

  const texts = [
    { label: t("imageDetail.description"), value: image.description },
    { label: t("imageDetail.alt"), value: image.alt },
  ].flatMap(({ label, value }) => (value === null ? [] : [{ label, value }]));

  return (
    <ImageViewer
      actions={null}
      alt={image.alt ?? ""}
      back={back}
      images={image.deliveryImages}
      missing={t("images.noDeliveryImage")}
      next={
        next === undefined
          ? undefined
          : { href: next, label: t("imageDetail.next") }
      }
      onSwipe={(direction) => {
        const target = direction === "previous" ? previous : next;

        if (target !== undefined) onMove(target);
      }}
      previous={
        previous === undefined
          ? undefined
          : { href: previous, label: t("imageDetail.previous") }
      }
    >
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
      {texts.length > 0 && <InfoList items={texts} layout="stacked" />}
      <Stack gap={3}>
        <Heading level={2}>{t("imageDetail.shotHeading")}</Heading>
        {shot.length === 0 ? (
          <Text tone="muted">{t("imageDetail.noShotInfo")}</Text>
        ) : (
          <InfoList
            items={shot.map(({ label, value }) => ({ label: t(label), value }))}
            layout="columns"
          />
        )}
      </Stack>
    </ImageViewer>
  );
};
