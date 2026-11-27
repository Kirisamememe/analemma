import { memo, type ReactNode } from "react";

import { toShotInfo } from "./logic/shot-info";

import type { ApiOutputs } from "@/api/api-types";
import { toImageStatusView } from "@/components/images/logic/image-status";
import { InfoList } from "@/features/images/ui/info-list";
import { formatDateTime } from "@/i18n/format-date-time";
import { useLocale, useTranslate } from "@/i18n/use-translate";
import { Cluster, Heading, Stack, Text } from "@/ui/layout";
import { Badge } from "@/ui/primitives/badge";

/** 画像の情報の欄に渡す値。 */
type ImageInfoProps = {
  /** 前後の写真の取得に失敗したときの案内。 */
  navigationError?: ReactNode;
  /** 見る画像。 */
  image: ApiOutputs["admin"]["images"]["get"];
};

const ImageInfoContent = ({
  image,
  navigationError,
}: ImageInfoProps): ReactNode => {
  const t = useTranslate();
  const locale = useLocale();
  const name = image.title ?? t("imageDetail.untitled");
  const isPublished = image.status === "published";
  const status = toImageStatusView(image.status);
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
          <output>
            <Badge tone={isPublished ? "success" : status.tone}>
              {t(status.badge ?? "imageDetail.published")}
            </Badge>
          </output>
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

/** 画像の名前・状態・説明・撮影の情報。 */
export const ImageInfo = memo(ImageInfoContent);
