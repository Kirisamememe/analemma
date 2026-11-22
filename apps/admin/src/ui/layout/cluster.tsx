import type { ReactNode } from "react";

import type { Space } from "@/ui/layout/space";
import { tv } from "@/ui/tv";

const cluster = tv({
  base: "flex flex-wrap",
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
    justify: {
      start: "justify-start",
      end: "justify-end",
      between: "justify-between",
    },
    align: {
      center: "items-center",
      start: "items-start",
      baseline: "items-baseline",
    },
  },
});

/** 横に並べる箱に渡す値。 */
type ClusterProps = {
  /** 子の間の空き。 */
  readonly gap?: Space;
  /** 子の横の寄せ方。 */
  readonly justify?: "start" | "end" | "between";
  /** 子の縦の揃え方。 */
  readonly align?: "center" | "start" | "baseline";
  /** 並べる子。 */
  readonly children: ReactNode;
};

/** 子を横に並べ、入りきらなければ折り返す箱。 */
export const Cluster = ({
  gap = 2,
  justify = "start",
  align = "center",
  children,
}: ClusterProps): ReactNode => (
  <div className={cluster({ gap, justify, align })}>{children}</div>
);
