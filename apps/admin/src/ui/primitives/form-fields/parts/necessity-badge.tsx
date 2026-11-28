import type { ReactNode } from "react";

import { Badge } from "@/ui/primitives/badge";

/** 入力が要るかを示すラベルに渡す値。 */
type NecessityBadgeProps = {
  /** 入力が要るか、任意か。 */
  necessity: "required" | "optional";
  /** 「必須」を読み上げに含めるか。 */
  isSpoken?: boolean | undefined;
  /** ラベルの文言。 */
  children: string;
};

/** 入力が要るか、任意かを示すラベル。 */
export const NecessityBadge = ({
  necessity,
  isSpoken = false,
  children,
}: NecessityBadgeProps): ReactNode => {
  const isHidden = necessity === "optional" || !isSpoken;

  return (
    <span aria-hidden={isHidden ? "true" : undefined} className="flex shrink-0">
      <Badge
        tone={necessity === "required" ? "danger" : "neutral"}
        variant="soft"
      >
        {children}
      </Badge>
    </span>
  );
};
