import { type ReactNode, useRef } from "react";

import { type DeliveryImages, toSrcSet } from "./logic/delivery-image";
import { toSwipe } from "./logic/swipe";

import { Icon } from "@/ui/primitives/graphics";
import { Link } from "@/ui/primitives/navigation";
import type { AppHref } from "@/ui/primitives/ui-provider";
import { tv } from "@/ui/tv";
import { typography } from "@/ui/typography";

const viewer = tv({
  slots: {
    root: "flex min-h-dvh flex-col bg-canvas scheme-dark md:h-dvh",
    bar: [
      "sticky top-0 z-sticky",
      "flex h-nav-bar shrink-0 items-center justify-between gap-3",
      "border-b bg-surface px-4",
    ],
    actions: "flex items-center gap-2",
    body: "flex grow flex-col md:min-h-0 md:flex-row",
    stage: [
      "group relative flex items-center justify-center",
      "md:min-h-0 md:grow md:p-6",
      "touch-pan-y touch-pinch-zoom", // 横の動きはスワイプに使い、縦の scroll と拡大は残す
    ],
    photo: "block max-h-dvh w-full object-contain md:size-full md:max-h-none",
    missing: [
      "flex aspect-photo w-full flex-col items-center justify-center gap-2",
      "text-fg-muted md:w-auto md:max-w-md",
    ],
    side: [
      "absolute inset-y-0 flex items-center px-3",
      "opacity-0 transition group-hover:opacity-100 focus-within:opacity-100",
      "pointer-coarse:pointer-events-none", // タッチでは見えないボタンを押させず、スワイプで移る
    ],
    previous: "left-0",
    next: "right-0",
    control: [
      "flex size-control items-center justify-center rounded-full",
      "bg-scrim/40 text-on-media outline outline-fg/20", // 暗い地の上でも写真の上でも、縁が見える
      "transition group-is-hovered:bg-scrim/60",
    ],
    panel: [
      "flex flex-col gap-6 border-t bg-surface p-6",
      "md:w-88 md:shrink-0 md:overflow-y-auto md:border-t-0 md:border-l",
    ],
    message: "flex grow items-center justify-center p-6",
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
  /** 前の画像(無ければ出さない)。 */
  previous?: Neighbor | undefined;
  /** 次の画像(無ければ出さない)。 */
  next?: Neighbor | undefined;
  /** タッチで左右にスワイプしたときに呼ぶ関数。 */
  onSwipe: (direction: "previous" | "next") => void;
  /** 情報の欄の中身。 */
  children: ReactNode;
};

/** 触れ始めた位置と時刻。 */
type Touch = {
  /** pointer の ID。 */
  readonly id: number;
  /** 横の位置。 */
  readonly x: number;
  /** 縦の位置。 */
  readonly y: number;
  /** 触れた時刻(ms)。 */
  readonly at: number;
};

/** 写真の左右に重ねる、前後の画像へのリンクに渡す値。 */
type SideLinkProps = {
  /** 移る先。 */
  neighbor: Neighbor;
  /** 向きのアイコン。 */
  icon: "chevron-left" | "chevron-right";
  /** 置く側。 */
  place: "previous" | "next";
};

const SideLink = ({ neighbor, icon, place }: SideLinkProps): ReactNode => (
  <span className={style.side({ className: style[place]() })}>
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
  const touch = useRef<Touch>(undefined);
  const smallest = images[0];
  const largest = images.at(-1);

  return (
    <ViewerFrame actions={actions} back={back}>
      <div className={style.body()}>
        <div
          className={style.stage()}
          onPointerCancel={() => {
            touch.current = undefined;
          }}
          onPointerDown={(event) => {
            touch.current =
              event.pointerType === "mouse"
                ? undefined
                : {
                    id: event.pointerId,
                    x: event.clientX,
                    y: event.clientY,
                    at: event.timeStamp,
                  };
          }}
          onPointerUp={(event) => {
            const start = touch.current;

            touch.current = undefined;

            if (start?.id !== event.pointerId) return;

            const direction = toSwipe({
              dx: event.clientX - start.x,
              dy: event.clientY - start.y,
              duration: event.timeStamp - start.at,
            });

            if (direction !== undefined) onSwipe(direction);
          }}
        >
          {smallest === undefined || largest === undefined ? (
            <div className={style.missing()}>
              <Icon name="image-off" size="xl" />
              <span className={typography({ role: "body" })}>{missing}</span>
            </div>
          ) : (
            <img
              alt={alt}
              className={style.photo()}
              height={largest.height}
              sizes="(min-width: 48rem) calc(100vw - 25rem), 100vw"
              src={smallest.url}
              srcSet={toSrcSet(images)}
              width={largest.width}
            />
          )}
          {previous !== undefined && (
            <SideLink
              icon="chevron-left"
              neighbor={previous}
              place="previous"
            />
          )}
          {next !== undefined && (
            <SideLink icon="chevron-right" neighbor={next} place="next" />
          )}
        </div>
        <aside className={style.panel()}>{children}</aside>
      </div>
    </ViewerFrame>
  );
};
