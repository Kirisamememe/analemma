import type { ReactNode } from "react";

import {
  type DeliveryImages,
  toSrcSet,
  toTileSizes,
} from "../logic/delivery-image";
import { rows } from "./image-rows-style";

import { Text } from "@/ui/layout";
import { Badge } from "@/ui/primitives/badge";
import { Icon, Spinner } from "@/ui/primitives/graphics";

/** 写真のタイルの中身に渡す値。 */
export type ImageTileBodyProps = {
  /** 1枚の選択用に写真全体を見せるか。 */
  singleChoice: boolean;
  /** 配信用の画像(幅の昇順)。 */
  images: DeliveryImages;
  /** 枠の縦横比(幅 ÷ 高さ)。 */
  aspect: number;
  /** タイトル(無ければ null)。 */
  title: string | null;
  /** 写真の alt。 */
  alt?: string | null | undefined;
  /** タイトルが無いときに出す文言。 */
  untitled: string;
  /** 配信用の画像が無いときに出す文言。 */
  missing: string;
  /** タイトルの横に添えるバッジの文言(無ければ出さない)。 */
  badge?: string | undefined;
  /** バッジの色の用途。 */
  badgeTone: "neutral" | "info" | "danger";
  /** 配信用の画像ができるのを待っているか。 */
  isPending: boolean;
  /** タイトルの下に出す日付(無ければ出さない)。 */
  date?: string | undefined;
};

/** 写真のタイルの、写真の枠と、タイトル・バッジ・日付。 */
export const ImageTileBody = ({
  singleChoice,
  images,
  aspect,
  title,
  alt,
  untitled,
  missing,
  badge,
  badgeTone,
  isPending,
  date,
}: ImageTileBodyProps): ReactNode => {
  const [smallest] = images;
  const isUntitled = title === null;
  const style = rows({ isUntitled, selectable: singleChoice });

  const missingIcon = isPending ? (
    <Spinner />
  ) : (
    <Icon name="image-off" size="lg" />
  );

  const hiddenAlt = isUntitled && alt && <span className="sr-only">{alt}</span>;
  const photoAlt = isUntitled ? (alt ?? "") : "";

  return (
    <span className={style.body()}>
      <span className={style.frame()}>
        {smallest === undefined ? (
          <span className={style.missing()}>
            {missingIcon}
            <Text as="span" variant="caption">
              {missing}
            </Text>
            {hiddenAlt}
          </span>
        ) : (
          <img
            alt={photoAlt}
            className={style.photo()}
            decoding="async"
            height={smallest.height}
            loading="lazy"
            sizes={toTileSizes(aspect)}
            src={smallest.url}
            srcSet={toSrcSet(images)}
            width={smallest.width}
          />
        )}
        <span className={style.shade()} />
      </span>
      <span className={style.caption()}>
        <span className={style.heading()}>
          <span className={style.title()} title={title ?? undefined}>
            <Text as="span" variant={isUntitled ? "body" : "label"}>
              {title ?? untitled}
            </Text>
          </span>
          {badge !== undefined && (
            <span className={style.badge()}>
              <Badge tone={badgeTone}>{badge}</Badge>
            </span>
          )}
        </span>
        {date !== undefined && (
          <Text as="span" tone="muted" variant="caption">
            {date}
          </Text>
        )}
      </span>
    </span>
  );
};
