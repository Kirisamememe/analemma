import type { ReactNode } from "react";

import { tv } from "@/ui/tv";

const list = tv({ base: "flex flex-col gap-8 md:gap-4" });

const row = tv({
  base: "flex flex-wrap items-center justify-between",
  variants: {
    card: { true: "gap-x-3 gap-y-1", false: "gap-x-4 gap-y-2 md:gap-y-4" },
  },
});

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

type ActionListRowProps = {
  /** 枠のあるカードの中か。 */
  card?: boolean;
  /** 行に表示する情報と操作。 */
  children: ReactNode;
};

/** 一覧の1行に、情報とそれに対する操作を並べる。 */
export const ActionListRow = ({
  card = false,
  children,
}: ActionListRowProps): ReactNode => (
  <div className={row({ card })}>{children}</div>
);
