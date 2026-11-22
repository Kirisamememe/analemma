import type { ReactNode } from "react";

import { tv } from "../tv";

const stage = tv({
  base: "flex max-w-full flex-col gap-4 rounded-surface bg-surface p-8 outline outline-fg/10",
  variants: {
    width: {
      fit: "items-center",
      fill: "w-lg items-stretch",
    },
  },
});

/** `StoryStage` に渡す値。 */
type StoryStageProps = {
  /** 枠の幅(中身に合わせるか、決めた幅に広げるか)。 */
  readonly width: "fit" | "fill";
  /** 展示する部品。 */
  readonly children: ReactNode;
};

/** story の部品を、面の上に置いて見せる展示用の枠。 */
export const StoryStage = ({ width, children }: StoryStageProps): ReactNode => (
  <div className={stage({ width })}>{children}</div>
);
