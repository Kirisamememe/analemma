import type { ReactNode } from "react";

import type { Space } from "@/ui/layout/space";
import { tv } from "@/ui/tv";

const stack = tv({
  base: "flex flex-col",
  variants: {
    gap: {
      0: "gap-0",
      0.5: "gap-0.5",
      1: "gap-1",
      1.5: "gap-1.5",
      2: "gap-2",
      3: "gap-3",
      4: "gap-4",
      6: "gap-6",
      8: "gap-8",
      12: "gap-12",
    },
    align: {
      stretch: "items-stretch",
      start: "items-start",
      center: "items-center",
    },
  },
});

/** 縦に並べる箱に渡す値。 */
type StackProps = {
  /** 子の間の空き。 */
  readonly gap?: Space;
  /** 子の横の揃え方。 */
  readonly align?: "stretch" | "start" | "center";
  /** 箱にする要素。 */
  readonly as?: "div" | "section" | "ul" | "ol";
  /** 並べる子。 */
  readonly children: ReactNode;
};

/** 子を縦に、決めた空きで並べる箱。 */
export const Stack = ({
  gap = 4,
  align = "stretch",
  as: Element = "div",
  children,
}: StackProps): ReactNode => (
  <Element className={stack({ gap, align })}>{children}</Element>
);
