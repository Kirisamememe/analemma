import type { ReactNode } from "react";

import { tv } from "@/ui/tv";

const skeleton = tv({
  slots: {
    box: "flex items-center",
    bar: "skeleton-animation block bg-surface-muted",
  },
  variants: {
    shape: {
      media: { box: "absolute inset-0", bar: "size-full" },
      text: { box: "h-5", bar: "h-3 rounded-xs" },
      caption: { box: "h-4.5", bar: "h-2.5 rounded-xs" },
      control: { box: "h-control", bar: "h-full rounded-control" },
      "control-sm": { box: "h-control-sm", bar: "h-full rounded-control" },
    },
    width: {
      xs: { bar: "w-16" },
      sm: { bar: "w-24" },
      md: { bar: "w-40" },
      lg: { bar: "w-64 max-w-full" },
      full: { box: "w-full", bar: "w-full" },
    },
  },
});

/** 骨組みの1つに渡す値。 */
type SkeletonProps = {
  /** なぞる中身(文字の1行、入力欄、ボタン、画像)。 */
  shape: "text" | "caption" | "control" | "control-sm" | "media";
  /** 幅。 */
  width: "xs" | "sm" | "md" | "lg" | "full";
};

/** 読み込む中身の形をなぞる骨組み(スクリーンリーダーには出さない)。 */
export const Skeleton = ({ shape, width }: SkeletonProps): ReactNode => {
  const { box, bar } = skeleton({ shape, width });

  return (
    <span aria-hidden="true" className={box()}>
      <span className={bar()} />
    </span>
  );
};
