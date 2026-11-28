import type { ReactNode } from "react";

import { Badge } from "@/ui/primitives/badge";

/** 入力が要ることを示すラベルに渡す値。 */
type RequiredBadgeProps = {
  /** 入力が要ることを示す文言。 */
  children: string;
};

/** 入力が要ることを示すラベル。 */
export const RequiredBadge = ({ children }: RequiredBadgeProps): ReactNode => (
  <span aria-hidden="true" className="flex shrink-0">
    <Badge tone="danger" variant="soft">
      {children}
    </Badge>
  </span>
);
