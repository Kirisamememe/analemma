import { type ReactNode, useRef } from "react";

import { usePhotoGestures } from "../hooks/use-photo-gestures";
import { photoEnds } from "../logic/photo-ends";
import { SideLink } from "./side-link";
import { ViewerPhoto } from "./viewer-photo";
import { ViewerProgress } from "./viewer-progress";
import { viewerStyle as style } from "./viewer-styles";

import { useTranslate } from "@/i18n/use-translate";
import { Text } from "@/ui/layout";
import type { DeliveryImages } from "@/ui/patterns/photos/logic/delivery-image";
import { Icon, Spinner } from "@/ui/primitives/graphics";
import type { AppHref } from "@/ui/primitives/ui-provider";

/** 前後の画像へ移るリンク。 */
export type Neighbor = {
  /** 移る先。 */
  readonly href: AppHref;
  /** 次の写真を待っていて、この向きの移動を受け付けないか。 */
  readonly disabled?: boolean;
  /** リンクのアクセシブルな名前。 */
  readonly label: string;
  /** キーボードで移った後に focus を戻すリンク。 */
  readonly attach?: ((element: HTMLAnchorElement | null) => void) | undefined;
  /** キーボードでこのリンクを開くときに呼ぶ関数。 */
  readonly onKeyboardNavigate?: (() => void) | undefined;
};

/** 情報と一緒に表示する前に、読み込んでおく写真。 */
export type PendingPhoto = {
  /** 画像の ID。 */
  id: string;
  /** 配信用の画像の候補。 */
  images: DeliveryImages;
  /** 写真の代替テキスト。 */
  alt: string;
};

/** 写真を見る画面に渡す値。 */
type ImageViewerProps = {
  /** 表示している画像の ID。 */
  photoId?: string;
  /** 読み込みを待っている写真。 */
  pending?: PendingPhoto | undefined;
  /** 写真や情報の取得を待つ間の案内。 */
  waiting?: string | undefined;
  /** 写真を送った向き。 */
  direction?: "previous" | "next" | undefined;
  /** 画像を切り替えられるときに呼ぶ関数。 */
  onSettled?: ((id: string) => void) | undefined;
  /** 配信用の画像(幅の昇順)。 */
  images: DeliveryImages;
  /** 写真の alt。 */
  alt: string;
  /** 配信用の画像が無いときに出す文言。 */
  missing: string;
  /** 配信用の画像ができるのを待っているか。 */
  isPending?: boolean | undefined;
  /** 前の画像へのリンク。 */
  previous?: Neighbor | undefined;
  /** 次の画像へのリンク。 */
  next?: Neighbor | undefined;
  /** タッチで左右にスワイプしたときに呼ぶ関数。 */
  onSwipe: (direction: "previous" | "next") => void;
  /** 情報の欄の中身。 */
  children: ReactNode;
};

/** 写真を大きく表示し、写真の情報を添える画面。 */
export const ImageViewer = ({
  photoId,
  pending,
  waiting,
  direction,
  onSettled,
  images,
  alt,
  missing,
  isPending = false,
  previous,
  next,
  onSwipe,
  children,
}: ImageViewerProps): ReactNode => {
  const t = useTranslate();

  const { controlsVisible, handlers } = usePhotoGestures(onSwipe, {
    photoId,
    disabled: waiting !== undefined,
  });

  const panelPhoto = useRef<string>(undefined);
  const shown = photoEnds(images);
  const upcoming = pending && photoEnds(pending.images);

  const missingIcon = isPending ? (
    <Spinner />
  ) : (
    <Icon name="image-off" size="xl" />
  );

  const resetScroll = (panel: HTMLElement | null): void => {
    if (panel === null || panelPhoto.current === photoId) return;

    panelPhoto.current = photoId;
    panel.scrollTo({ top: 0, behavior: "instant" });
  };

  return (
    <div className={style.body()}>
      <div
        className={style.stage()}
        onPointerDown={handlers.onPointerDown}
        onPointerUp={handlers.onPointerUp}
        onPointerCancel={handlers.onPointerCancel}
      >
        {shown === undefined ? (
          <output className={style.missing()}>
            {missingIcon}
            <Text as="span">{missing}</Text>
          </output>
        ) : (
          <ViewerPhoto
            alt={alt}
            images={images}
            key={photoId ?? shown.smallest.url}
            direction={direction}
            largest={shown.largest}
            smallest={shown.smallest}
          />
        )}
        {pending && upcoming && (
          <ViewerPhoto
            key={pending.id}
            alt={pending.alt}
            images={pending.images}
            largest={upcoming.largest}
            smallest={upcoming.smallest}
            pending
            onSettled={() => onSettled?.(pending.id)}
          />
        )}
        {waiting !== undefined && <ViewerProgress label={waiting} />}
        {previous !== undefined && (
          <SideLink
            controlsVisible={controlsVisible}
            icon="chevron-left"
            neighbor={previous}
            onMove={() => {
              onSwipe("previous");
            }}
            place="previous"
          />
        )}
        {next !== undefined && (
          <SideLink
            controlsVisible={controlsVisible}
            icon="chevron-right"
            neighbor={next}
            onMove={() => {
              onSwipe("next");
            }}
            place="next"
          />
        )}
      </div>
      <aside
        aria-label={t("imageViewer.info")}
        ref={resetScroll}
        className={style.panel()}
        tabIndex={0}
      >
        {children}
      </aside>
    </div>
  );
};
