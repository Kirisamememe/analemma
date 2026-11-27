import type { ReactNode } from "react";

import { StoryStage } from "@/ui/specimens/story-stage";

/** `Staged` に渡す値。 */
type StagedProps = {
  /** 展示用の枠の幅(無ければ枠を付けない)。 */
  width: "fit" | "fill" | undefined;
  /** story の中身。 */
  children: ReactNode;
};

/** story を、展示用の枠に入れて見せる部品。 */
export const Staged = ({ width, children }: StagedProps): ReactNode =>
  width === undefined ? (
    children
  ) : (
    <StoryStage width={width}>{children}</StoryStage>
  );
