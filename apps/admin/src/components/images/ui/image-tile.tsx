import type { ReactNode, Ref } from "react";

import { type DeliveryImages, toTileAspect } from "../logic/delivery-image";
import { rows } from "./image-rows-style";
import { ImageTileBody } from "./image-tile-body";

import { Link } from "@/ui/primitives/navigation";

/** 写真のタイルに渡す値。 */
type ImageTileProps = {
  /** 1枚の選択用に写真全体を見せるか。 */
  singleChoice?: boolean | undefined;
  /** 開く画面。 */
  href?: string | undefined;
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

  const style = rows({ selectable: singleChoice });

  const body = (
    <ImageTileBody
      alt={alt}
      aspect={aspect}
      badge={badge}
      badgeTone={badgeTone}
      date={date}
      images={images}
      isPending={isPending}
      missing={missing}
      singleChoice={singleChoice}
      title={title}
      untitled={untitled}
    />
  );

  return (
    <li className={style.item()} style={{ "--media-aspect": String(aspect) }}>
      {href === undefined ? (
        <label className="group relative flex cursor-pointer flex-col gap-2 rounded-control has-focus-visible:focus-ring">
          {body}
          {choice}
        </label>
      ) : (
        <Link href={href} ref={linkRef} variant="block">
          {body}
        </Link>
      )}
    </li>
  );
};
