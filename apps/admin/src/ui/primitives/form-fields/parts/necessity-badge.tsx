import type { ReactNode } from "react";

import { Badge } from "@/ui/primitives/badge";

/** 入力が要るかを示すラベルに渡す値。 */
type NecessityBadgeProps = {
  /** 入力が要るか、任意か。 */
  necessity: "required" | "optional";
  /** ラベルの文言。 */
  children: string;
};

/** 入力が要るか、任意かを示すラベル。 */
export const NecessityBadge = ({
  necessity,
  children,
}: NecessityBadgeProps): ReactNode => (
  <span aria-hidden="true" className="flex shrink-0">
    <Badge
      tone={necessity === "required" ? "danger" : "neutral"}
      variant="soft"
    >
      {children}
    </Badge>
  </span>
);
