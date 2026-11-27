import type { ReactNode } from "react";

import { tv } from "@/ui/tv";

const list = tv({ base: "flex flex-col gap-8 md:gap-4" });

type ActionListProps = {
  /** 一覧か、一覧とその先頭の操作を囲む箱か。 */
  as?: "div" | "ul";
  /** 並べる行。 */
  children: ReactNode;
};

/** 操作のある行を並べる一覧。 */
export const ActionList = ({
  as: Element = "ul",
  children,
}: ActionListProps): ReactNode => (
  <Element className={list()}>{children}</Element>
);
