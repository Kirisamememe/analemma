import type { ReactNode } from "react";

import { ActionList } from "@/ui/primitives/collections";

/** 1件ずつ進める作業の一覧(写真を送る・取り込むなど)。 */
export const ProgressList = ({
  children,
}: Record<"children", ReactNode>): ReactNode => (
  <ActionList>{children}</ActionList>
);
