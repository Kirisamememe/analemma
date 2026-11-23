import type { ReactNode } from "react";

import { usePhotoGestures } from "./hooks/use-photo-gestures";
import type { DeliveryImages } from "./logic/delivery-image";
import { ViewerPhoto } from "./viewer-photo";
import { viewerStyle as style } from "./viewer-styles";

import { useTranslate } from "@/i18n/use-translate";
import { Text } from "@/ui/layout";
import { LoadingState } from "@/ui/patterns";
import { Icon } from "@/ui/primitives/graphics";
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

/** 読み込み中の写真と情報欄の骨組み。 */
export const ViewerLoading = (): ReactNode => (
  <div className={style.body({ className: "loading-state-animation" })}>
    <div className={style.stage()}>
      <span
        aria-hidden="true"
        className="skeleton-animation aspect-photo w-full rounded-surface bg-surface-muted"
      />
    </div>
    <div className={style.panel()}>
      <LoadingState layout="list" />
    </div>
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

/** 写真を見る画面に渡す値。 */
type ImageViewerProps = {
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

/** 写真と、その情報を表示する画面。 */
export const ImageViewer = ({
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
            key={smallest.url}
            largest={largest}
            smallest={smallest}
          />
        )}
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
