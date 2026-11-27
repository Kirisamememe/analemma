import type { ReactNode, Ref } from "react";

import { tv } from "@/ui/tv";

const footer = tv({
  slots: {
    container: [
      "pointer-events-none sticky bottom-0 z-sticky flex w-full shrink-0 flex-wrap",
      "items-center gap-4 px-panel short-viewport:static",
    ],
    slot: "pointer-events-auto flex min-w-0 flex-wrap items-center gap-2",
  },
  variants: {
    isFilled: {
      true: { container: "pt-3 pb-6" },
      false: { container: "pb-2" }, // 本文の下の余白(4)と合わせて、左右の余白と同じ 6 にする
    },
  },
});

/** フッターの左右に配置する内容。 */
export type ModalFooterSlots = {
  /** 左端に置く補足や操作。 */
  start?: ReactNode;
  /** 右端に置く補足や操作。 */
  end?: ReactNode;
};

type ModalFooterProps = ModalFooterSlots & {
  /** 高さを観測する要素。 */
  ref?: Ref<HTMLDivElement>;
};

const isRendered = (node: ReactNode): boolean =>
  node !== null && node !== undefined && typeof node !== "boolean";

/** 左右を独立して使える、モーダルの下端の帯。 */
export const ModalFooter = ({
  start,
  end,
  ref,
}: ModalFooterProps): ReactNode => {
  const hasStart = isRendered(start);
  const hasEnd = isRendered(end);
  const isFilled = hasStart || hasEnd;
  const { container, slot } = footer({ isFilled });

  return (
    <div
      className={container()}
      ref={ref}
      role={isFilled ? "contentinfo" : undefined}
    >
      {hasStart && <div className={slot()}>{start}</div>}
      {hasEnd && <div className={slot({ className: "ms-auto" })}>{end}</div>}
    </div>
  );
};
