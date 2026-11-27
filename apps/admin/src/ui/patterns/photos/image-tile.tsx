import type { ReactNode, Ref } from "react";

import { rows } from "./image-rows-style";
import {
  type DeliveryImages,
  toSrcSet,
  toTileAspect,
  toTileSizes,
} from "./logic/delivery-image";

import { Text } from "@/ui/layout";
import { Badge } from "@/ui/primitives/badge";
import { Icon, Spinner } from "@/ui/primitives/graphics";
import { Link } from "@/ui/primitives/navigation";
import type { AppHref } from "@/ui/primitives/ui-provider";

/** 写真のタイルに渡す値。 */
type ImageTileProps = {
  /** 1枚の選択用に写真全体を見せるか。 */
  singleChoice?: boolean | undefined;
  /** 開く画面。 */
  href?: AppHref | undefined;
  /** 写真を選ぶ入力欄。 */
  choice?: ReactNode;
  /** 配信用の画像(幅の昇順)。 */
  images: DeliveryImages;
  /** タイトル(無ければ null)。 */
  title: string | null;
  /** 写真の alt。 */
  alt?: string | null;
  /** タイトルが無いときに出す文言。 */
  untitled: string;
  /** 配信用の画像が無いときに出す文言。 */
  missing: string;
  /** タイトルの横に添えるバッジの文言(無ければ出さない)。 */
  badge?: string | undefined;
  /** バッジの色の用途。 */
  badgeTone?: "neutral" | "info" | "danger" | undefined;
  /** 配信用の画像ができるのを待っているか。 */
  isPending?: boolean | undefined;
  /** タイトルの下に出す日付(無ければ出さない)。 */
  date?: string | undefined;
  /** 開くリンクの要素(focus を移すときに使う)。 */
  linkRef?: Ref<HTMLAnchorElement> | undefined;
};

/** 写真と、タイトル・バッジ・日付を出し、押すと開くタイル。 */
export const ImageTile = ({
  href,
  singleChoice = false,
  choice,
  images,
  title,
  alt,
  untitled,
  missing,
  badge,
  badgeTone = "neutral",
  isPending = false,
  date,
  linkRef,
}: ImageTileProps): ReactNode => {
  const [smallest] = images;

  const aspect =
    singleChoice && smallest
      ? smallest.width / smallest.height
      : toTileAspect(images);

  const style = rows({
    isUntitled: title === null,
    selectable: singleChoice,
  });

  const content = (
    <span className={style.body()}>
      <span className={style.frame()}>
        {smallest === undefined ? (
          <span className={style.missing()}>
            {isPending ? <Spinner /> : <Icon name="image-off" size="lg" />}
            <Text as="span" variant="caption">
              {missing}
            </Text>
            {title === null && alt && <span className="sr-only">{alt}</span>}
          </span>
        ) : (
          <img
            alt={title === null ? (alt ?? "") : ""}
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
            <Text as="span" variant={title === null ? "body" : "label"}>
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

  return (
    <li className={style.item()} style={{ "--media-aspect": String(aspect) }}>
      {href === undefined ? (
        <label className="group relative flex cursor-pointer flex-col gap-2 rounded-control has-focus-visible:focus-ring">
          {content}
          {choice}
        </label>
      ) : (
        <Link href={href} ref={linkRef} variant="block">
          {content}
        </Link>
      )}
    </li>
  );
};
