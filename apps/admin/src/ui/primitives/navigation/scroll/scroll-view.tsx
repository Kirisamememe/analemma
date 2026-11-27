import { type ReactNode, useId } from "react";

import { useScrollThumbVisibility } from "./hooks/use-scroll-thumb-visibility";
import { type ScrollOrientation, useScrollView } from "./hooks/use-scroll-view";

import { tv } from "@/ui/tv";

const scroll = tv({
  slots: {
    root: "flex min-h-0 min-w-0",
    viewport: "min-h-0 min-w-0 scrollbar-none",
    content: "flow-root scroll-focus-inset",
    track: [
      "relative shrink-0 touch-none rounded-xs select-none",
      "group scroll-thumb-animation outline-hidden",
    ],
    thumb: [
      "absolute cursor-grab text-fg-muted/80 active:cursor-grabbing",
      "transition-colors group-focus-visible:text-fg-muted group-active:text-fg hover:text-fg-muted",
      "after:absolute after:rounded-full after:bg-current forced-colors:after:border-2",
      "group-focus-visible:after:focus-ring",
    ],
  },
  variants: {
    orientation: {
      horizontal: {
        root: "flex-col",
        viewport: "overflow-x-auto overscroll-x-contain",
        content: "w-max min-w-full",
        track: "h-6",
        thumb: [
          "top-0 left-(--scroll-thumb-position) h-full",
          "w-(--scroll-thumb-size) max-w-full min-w-6 -translate-x-(--scroll-thumb-position)",
          "after:inset-x-0 after:top-1/2 after:h-1 after:-translate-y-1/2",
        ],
      },
      vertical: {
        root: "h-full max-h-(--scroll-view-limit) flex-row",
        viewport: "grow overflow-y-auto overscroll-y-contain",
        track: "w-6",
        thumb: [
          "top-(--scroll-thumb-position) left-0 w-full",
          "h-(--scroll-thumb-size) max-h-full min-h-6 -translate-y-(--scroll-thumb-position)",
          "after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2",
        ],
      },
    },
    inset: { none: {}, modal: {} },
    snap: { true: { viewport: "snap-rail", content: "snap-rail-strip" } },
  },
  compoundVariants: [
    {
      orientation: "horizontal",
      inset: "modal",
      class: {
        content: "px-panel",
        viewport: "scroll-px-panel",
        track: "mx-panel",
      },
    },
    {
      orientation: "vertical",
      inset: "modal",
      class: {
        content: "py-panel",
        viewport: "scroll-py-panel",
        track: "my-panel",
      },
    },
  ],
});

/** スクロール領域に渡す値。 */
type ScrollViewProps = {
  /** スクロールの方向。 */
  orientation: ScrollOrientation;
  /** スクロールバーのアクセシブルな名前。 */
  label: string;
  /** スクロール方向の両端の余白。 */
  inset?: "none" | "modal";
  /** 中身の要素を、領域の左端に1つずつ止めるか(横方向だけ)。 */
  snap?: boolean;
  /** 縦方向の領域の高さの上限(px)。 */
  maxHeight?: number;
  /** スクロールする要素を受け取る関数。 */
  viewportRef?: (element: HTMLDivElement | null) => void;
  /** スクロールする中身。 */
  children: ReactNode;
};

/** ブラウザでスクロールでき、端に操作用のバーを持つ領域。 */
export const ScrollView = ({
  orientation,
  label,
  inset = "none",
  snap = false,
  maxHeight,
  viewportRef,
  children,
}: ScrollViewProps): ReactNode => {
  const id = useId();

  const {
    attach,
    attachTrack,
    content,
    thumb,
    measure,
    metrics,
    onKeyDown,
    startPointer,
    movePointer,
    endPointer,
  } = useScrollView(orientation, viewportRef);

  const { attach: attachRegion, visible } = useScrollThumbVisibility();
  const style = scroll({ orientation, inset, snap });

  return (
    <div
      className={style.root()}
      ref={attachRegion}
      style={{
        "--scroll-view-limit":
          maxHeight === undefined ? "100%" : `${String(maxHeight)}px`,
      }}
    >
      <div id={id} className={style.viewport()} onScroll={measure} ref={attach}>
        <div className={style.content()} ref={content}>
          {children}
        </div>
      </div>
      {metrics.thumbFraction !== 1 && (
        <div
          role="scrollbar"
          ref={attachTrack}
          aria-controls={id}
          aria-label={label}
          aria-orientation={orientation}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(metrics.position * 100)}
          tabIndex={0}
          className={style.track()}
          data-active={visible || undefined}
          onPointerDown={startPointer}
          onPointerMove={movePointer}
          onLostPointerCapture={endPointer}
          onKeyDown={onKeyDown}
        >
          <div
            className={style.thumb()}
            ref={thumb}
            style={{
              "--scroll-thumb-size": `${String(metrics.thumbFraction * 100)}%`,
              "--scroll-thumb-position": `${String(metrics.position * 100)}%`,
            }}
          />
        </div>
      )}
    </div>
  );
};
