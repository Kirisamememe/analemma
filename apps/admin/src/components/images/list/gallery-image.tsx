import { memo, type ReactNode } from "react";

import { toImageStatusView } from "../logic/image-status";
import type { GalleryOptions } from "./gallery-options";

import { formatLocalDate } from "@/i18n/format-date-time";
import { useLocale, useTranslate } from "@/i18n/use-translate";
import type { ImageSummary } from "@/queries/images-query";
import { ImageTile } from "@/ui/patterns";

/** 一覧の1枚のタイルに渡す値。 */
type GalleryImageProps = GalleryOptions & {
  /** 表示する画像。 */
  image: ImageSummary;
  /** ページの最初の画像か。 */
  first: boolean;
  /** ページを読み込んだ後の focus の移動先。 */
  focusFirst: (element: HTMLElement | null) => void;
};

const GalleryImageContent = ({
  image,
  first,
  focusFirst,
  imageHref,
  singleChoice,
  renderChoice,
}: GalleryImageProps): ReactNode => {
  const t = useTranslate();
  const locale = useLocale();
  const status = toImageStatusView(image.status);

  return (
    <ImageTile
      singleChoice={singleChoice}
      alt={image.alt}
      badge={status.badge === undefined ? undefined : t(status.badge)}
      badgeTone={status.tone}
      isPending={status.isPending}
      date={
        image.takenAt === null
          ? undefined
          : formatLocalDate(locale, image.takenAt)
      }
      href={imageHref?.(image.id)}
      choice={renderChoice?.(image, focusFirst)}
      images={image.deliveryImages}
      linkRef={first ? focusFirst : undefined}
      missing={t(status.missing)}
      title={image.title}
      untitled={t("images.untitled")}
    />
  );
};

/** 画像の状態と日付を添えた、一覧の1枚のタイル。 */
export const GalleryImage = memo(GalleryImageContent);
