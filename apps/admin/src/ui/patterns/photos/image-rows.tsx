import type { ReactNode, Ref } from "react";

import { LoadingState } from "../loading-state";
import {
  type DeliveryImages,
  toSrcSet,
  toTileAspect,
  toTileSizes,
} from "./logic/delivery-image";

import { Text } from "@/ui/layout";
import { Badge } from "@/ui/primitives/badge";
import { Icon, Skeleton } from "@/ui/primitives/graphics";
import { Link } from "@/ui/primitives/navigation";
import type { AppHref } from "@/ui/primitives/ui-provider";
import { tv } from "@/ui/tv";

const rows = tv({
  slots: {
    list: ["flex flex-wrap gap-x-3 gap-y-6", "after:grow-999"],
    item: "flex min-w-0 grow-(--media-aspect) flex-col",
    body: "flex flex-col gap-2",
    frame: [
      "relative aspect-(--media-aspect) w-full overflow-hidden rounded-control bg-surface-muted",
      "min-h-28 @md:max-h-66 @md:min-h-44",
    ],
    photo: "absolute inset-0 size-full object-cover object-focal",
    shade: [
      "pointer-events-none absolute inset-0 bg-scrim/10 opacity-0 transition",
      "group-is-hovered:opacity-100",
    ],
    missing: [
      "absolute inset-0 flex flex-col items-center justify-center gap-1",
      "p-2 text-center text-fg-muted",
    ],
    caption: "flex w-0 min-w-full flex-col",
    heading: "flex min-w-0 flex-wrap items-center gap-2",
    title: "w-8 max-w-fit min-w-0 grow truncate",
    badge: "flex max-w-full min-w-0 wrap-anywhere",
  },
  variants: {
    selectable: {
      true: {
        photo: "object-contain",
        shade: "group-hover:opacity-100",
        title: "group-has-checked:text-success",
      },
    },
    isUntitled: {
      true: { title: "text-fg-muted" },
    },
  },
});

/** 写真の行に渡す値。 */
type ImageRowsProps = {
  /** 一覧のアクセシブルな名前。 */
  label: string;
  /** 一覧の要素。 */
  listRef?: Ref<HTMLUListElement>;
  /** 並べるタイル(`ImageTile`)。 */
  children: ReactNode;
};

/** 写真の縦横比を保ったまま、高さをそろえて行の幅いっぱいに並べる一覧。 */
export const ImageRows = ({
  label,
  listRef,
  children,
}: ImageRowsProps): ReactNode => (
  // oxlint-disable-next-line jsx-a11y/no-redundant-roles -- WebKit はマーカーのない ul を group として読み上げる
  <ul aria-label={label} className={rows().list()} ref={listRef} role="list">
    {children}
  </ul>
);

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
            <Icon name="image-off" size="lg" />
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
              <Badge tone="neutral">{badge}</Badge>
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

const PLACEHOLDERS = [
  { key: "a", aspect: 1.5 },
  { key: "b", aspect: 0.67 },
  { key: "c", aspect: 1.5 },
  { key: "d", aspect: 1 },
  { key: "e", aspect: 1.78 },
  { key: "f", aspect: 0.75 },
  { key: "g", aspect: 1.5 },
  { key: "h", aspect: 1.5 },
  { key: "i", aspect: 0.67 },
  { key: "j", aspect: 1.5 },
] as const;

/** 写真の骨組みに渡す値。 */
type ImageRowsPlaceholderProps = {
  /** 読み込んでいることを伝える文言。 */
  label: string;
};

/** 一覧を読み込む間に、写真の形の灰色の枠を並べる骨組み。 */
export const ImageRowsPlaceholder = ({
  label,
}: ImageRowsPlaceholderProps): ReactNode => {
  const style = rows();

  return (
    <LoadingState layout="custom" label={label}>
      <ul aria-hidden="true" className={style.list()}>
        {PLACEHOLDERS.map(({ key, aspect }) => (
          <li
            className={style.item()}
            key={key}
            style={{ "--media-aspect": String(aspect) }}
          >
            <span className={style.body()}>
              <span className={style.frame()}>
                <Skeleton shape="media" width="full" />
              </span>
            </span>
          </li>
        ))}
      </ul>
    </LoadingState>
  );
};
