import type { ReactNode } from "react";

import { usePhotoGestures } from "./hooks/use-photo-gestures";
import type { DeliveryImages } from "./logic/delivery-image";
import { ViewerPhoto } from "./viewer-photo";
import { viewerStyle as style } from "./viewer-styles";

import { useTranslate } from "@/i18n/use-translate";
import { Text } from "@/ui/layout";
import { LoadingStatus } from "@/ui/patterns";
import { Icon, Spinner } from "@/ui/primitives/graphics";
import { Link } from "@/ui/primitives/navigation";
import type { AppHref } from "@/ui/primitives/ui-provider";
/** 写真を見る画面の骨組みに渡す値。 */
type ViewerFrameProps = {
  /** 帯の左に置く、一覧へ戻るリンク。 */
  back: ReactNode;
  /** 帯の右に置く操作。 */
  actions?: ReactNode;
  /** 帯の下の中身。 */
  children: ReactNode;
};

/** 写真を見る画面の、暗い地と上の帯。 */
export const ViewerFrame = ({
  back,
  actions,
  children,
}: ViewerFrameProps): ReactNode => (
  <div className={style.root()}>
    <header data-top-bar="viewer" className={style.bar()}>
      {back}
      <div className={style.actions()}>{actions}</div>
    </header>
    <main className={style.content()}>{children}</main>
  </div>
);

/** 写真を見る画面の真ん中に置く知らせに渡す値。 */
type ViewerMessageProps = {
  /** 知らせ(読み込み中・読み込めなかった欄など)。 */
  children: ReactNode;
};

/** 写真の代わりに、画面の真ん中に知らせを置く。 */
export const ViewerMessage = ({ children }: ViewerMessageProps): ReactNode => (
  <div className={style.message()}>{children}</div>
);

/** 前後の画像へ移るリンク。 */
export type Neighbor = {
  /** 移る先。 */
  readonly href: AppHref;
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
  /** 写真の切り替えを待っているか。 */
  waiting?: boolean | undefined;
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
  /** 前の画像へのリンク。 */
  previous?: Neighbor | undefined;
  /** 次の画像へのリンク。 */
  next?: Neighbor | undefined;
  /** タッチで左右にスワイプしたときに呼ぶ関数。 */
  onSwipe: (direction: "previous" | "next") => void;
  /** 情報の欄の中身。 */
  children: ReactNode;
};

/** 写真の左右に重ねる、前後の画像へのリンクに渡す値。 */
type SideLinkProps = {
  /** 移る先。 */
  neighbor: Neighbor;
  /** 向きのアイコン。 */
  icon: "chevron-left" | "chevron-right";
  /** 置く側。 */
  place: "previous" | "next";
  /** タップで矢印を表示しているか。 */
  controlsVisible: boolean;
};

const SideLink = ({
  neighbor: { href, label, attach, onKeyboardNavigate },
  icon,
  place,
  controlsVisible,
}: SideLinkProps): ReactNode => (
  <span
    className={style.side({ controlsVisible, className: style[place]() })}
    onClickCapture={(event) => {
      if (
        event.detail === 0 &&
        !event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.shiftKey
      ) {
        onKeyboardNavigate?.();
      }
    }}
  >
    <Link href={href} variant="block" ref={attach}>
      <span className={style.control()}>
        <Icon name={icon} size="lg" />
        <span className="sr-only">{label}</span>
      </span>
    </Link>
  </span>
);

const Progress = (): ReactNode => {
  const t = useTranslate();
  return (
    <>
      <LoadingStatus label={t("imageViewer.loading")} />
      <div aria-hidden="true" className={style.progress()}>
        <Spinner />
        <Text as="span">{t("imageViewer.loading")}</Text>
      </div>
    </>
  );
};

/** 暗い地に写真を大きく出し、横に情報の欄を置く、写真を見る画面。 */
export const ImageViewer = ({
  photoId,
  pending,
  waiting,
  direction,
  onSettled,
  images,
  alt,
  missing,
  previous,
  next,
  onSwipe,
  children,
}: ImageViewerProps): ReactNode => {
  const t = useTranslate();
  const { controlsVisible, handlers } = usePhotoGestures(onSwipe);
  const smallest = images[0];
  const largest = images.at(-1);
  const pendingSmallest = pending?.images[0];
  const pendingLargest = pending?.images.at(-1);

  return (
    <div className={style.body()}>
      <div
        className={style.stage()}
        onPointerDown={handlers.onPointerDown}
        onPointerUp={handlers.onPointerUp}
        onPointerCancel={handlers.onPointerCancel}
      >
        {smallest === undefined || largest === undefined ? (
          <div className={style.missing()}>
            <Icon name="image-off" size="xl" />
            <Text as="span">{missing}</Text>
          </div>
        ) : (
          <ViewerPhoto
            alt={alt}
            images={images}
            key={photoId ?? smallest.url}
            direction={direction}
            largest={largest}
            smallest={smallest}
          />
        )}
        {pending !== undefined &&
          pendingSmallest !== undefined &&
          pendingLargest !== undefined && (
            <ViewerPhoto
              key={pending.id}
              alt={pending.alt}
              images={pending.images}
              largest={pendingLargest}
              smallest={pendingSmallest}
              pending
              onSettled={() => onSettled?.(pending.id)}
            />
          )}
        {waiting === true && <Progress />}
        {previous !== undefined && (
          <SideLink
            controlsVisible={controlsVisible}
            icon="chevron-left"
            neighbor={previous}
            place="previous"
          />
        )}
        {next !== undefined && (
          <SideLink
            controlsVisible={controlsVisible}
            icon="chevron-right"
            neighbor={next}
            place="next"
          />
        )}
      </div>
      <aside
        aria-label={t("imageViewer.info")}
        className={style.panel()}
        // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- WebKit ではスクロールする情報欄に Tab で移れない
        tabIndex={0}
      >
        {children}
      </aside>
    </div>
  );
};
