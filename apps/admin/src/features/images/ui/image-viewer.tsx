import type { ReactNode } from "react";

import { usePhotoGestures } from "./hooks/use-photo-gestures";
import type { DeliveryImages } from "./logic/delivery-image";
import { ViewerPhoto } from "./viewer-photo";

import { useTranslate } from "@/i18n/use-translate";
import { Text } from "@/ui/layout";
import { Icon } from "@/ui/primitives/graphics";
import { Link } from "@/ui/primitives/navigation";
import type { AppHref } from "@/ui/primitives/ui-provider";
import { tv } from "@/ui/tv";

const viewer = tv({
  slots: {
    root: "flex min-h-dvh flex-col bg-canvas scheme-dark md:h-dvh",
    bar: [
      "sticky top-0 z-sticky short-viewport:static",
      "flex h-nav-bar shrink-0 items-center justify-between gap-3",
      "border-b bg-surface px-4",
    ],
    actions: "flex items-center gap-2",
    body: "flex grow flex-col md:min-h-0 md:flex-row",
    stage: [
      "group relative flex items-center justify-center",
      "md:min-h-0 md:min-w-0 md:grow md:p-6",
      "touch-pan-y touch-pinch-zoom", // 横の動きはスワイプに使い、縦の scroll と拡大は残す
    ],
    missing: [
      "flex aspect-photo w-full flex-col items-center justify-center gap-2",
      "text-fg-muted md:w-auto md:max-w-md",
    ],
    side: [
      "absolute inset-y-0 flex items-center px-3",
      "opacity-0 transition focus-within:opacity-100 pointer-fine:group-hover:opacity-100",
    ],
    previous: "left-0",
    next: "right-0",
    control: [
      "flex size-control items-center justify-center rounded-full",
      "bg-scrim/60 text-on-media outline outline-fg/20", // 暗い地の上でも写真の上でも、縁が見える
      "transition group-is-hovered:bg-scrim",
      "group-is-focus-shown:bg-scrim group-is-focus-shown:outline-2 group-is-focus-shown:-outline-offset-2 group-is-focus-shown:outline-current",
    ],
    panel: [
      "flex flex-col gap-6 border-t bg-surface p-6",
      "md:w-88 md:shrink-0 md:overflow-y-auto md:border-t-0 md:border-l",
      "focus-visible:focus-ring-inset",
    ],
    message: "flex grow items-center justify-center p-6",
  },
  variants: {
    controlsVisible: {
      true: { side: "opacity-100" },
      false: { side: "pointer-coarse:pointer-events-none" },
    },
  },
});

const style = viewer();

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
    <header className={style.bar()}>
      {back}
      <div className={style.actions()}>{actions}</div>
    </header>
    {children}
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
};

/** 写真を見る画面に渡す値。 */
type ImageViewerProps = {
  /** 帯の左に置く、一覧へ戻るリンク。 */
  back: ReactNode;
  /** 帯の右に置く操作。 */
  actions: ReactNode;
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
  neighbor,
  icon,
  place,
  controlsVisible,
}: SideLinkProps): ReactNode => (
  <span className={style.side({ controlsVisible, className: style[place]() })}>
    <Link href={neighbor.href} variant="block">
      <span className={style.control()}>
        <Icon name={icon} size="lg" />
        <span className="sr-only">{neighbor.label}</span>
      </span>
    </Link>
  </span>
);

/** 暗い地に写真を大きく出し、横に情報の欄を置く、写真を見る画面。 */
export const ImageViewer = ({
  back,
  actions,
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
    <ViewerFrame actions={actions} back={back}>
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
    </ViewerFrame>
  );
};
