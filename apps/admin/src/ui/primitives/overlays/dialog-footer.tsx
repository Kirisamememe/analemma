import { Children, type ReactNode, type Ref } from "react";

import { tv } from "@/ui/tv";

const footer = tv({
  slots: {
    container: [
      "pointer-events-none sticky bottom-0 z-sticky flex w-full shrink-0 flex-wrap",
      "items-center gap-4 px-panel pt-3 pb-6",
    ],
    slot: "pointer-events-auto flex min-w-0 flex-wrap items-center gap-2",
    actions: [
      "-m-2 inline-flex min-w-0 flex-wrap items-center gap-2",
      "rounded-surface dialog-bar-backdrop p-2",
    ],
  },
});

/** フッターの左右に配置する内容。 */
export type DialogFooterSlots = {
  /** 左端に置く補足や操作。 */
  start?: ReactNode;
  /** 右端に置く補足や操作。 */
  end?: ReactNode;
};

type DialogFooterProps = DialogFooterSlots & {
  /** 高さを観測する要素。 */
  ref?: Ref<HTMLElement>;
};

/** 左右を独立して使える、Dialog の固定フッター。 */
export const DialogFooter = ({
  start,
  end,
  ref,
}: DialogFooterProps): ReactNode => {
  const left = Children.toArray(start);
  const right = Children.toArray(end);
  const { container, slot } = footer();

  if (left.length === 0 && right.length === 0) return null;

  return (
    <footer className={container()} ref={ref}>
      {left.length > 0 && <div className={slot()}>{left}</div>}
      {right.length > 0 && (
        <div className={slot({ className: "ms-auto" })}>{right}</div>
      )}
    </footer>
  );
};

/** 固定フッターの操作の背後にぼかしを掛けるまとまり。 */
export const DialogActions = ({
  children,
}: Readonly<Record<"children", ReactNode>>): ReactNode => (
  <div className={footer().actions()}>{children}</div>
);
