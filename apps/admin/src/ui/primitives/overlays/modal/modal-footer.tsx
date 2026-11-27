import { Children, type ReactNode, type Ref } from "react";

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
  ref?: Ref<HTMLElement>;
};

/** 左右を独立して使える、モーダルの下端の帯。 */
export const ModalFooter = ({
  start,
  end,
  ref,
}: ModalFooterProps): ReactNode => {
  const left = Children.toArray(start);
  const right = Children.toArray(end);

  const { container, slot } = footer({
    isFilled: left.length > 0 || right.length > 0,
  });

  return (
    <footer className={container()} ref={ref}>
      {left.length > 0 && <div className={slot()}>{left}</div>}
      {right.length > 0 && (
        <div className={slot({ className: "ms-auto" })}>{right}</div>
      )}
    </footer>
  );
};
