import type { ReactNode } from "react";

import { tv } from "@/ui/tv";

const row = tv({
  base: "flex flex-wrap items-center justify-between",
  variants: {
    card: { true: "gap-x-3 gap-y-1", false: "gap-x-4 gap-y-2 md:gap-y-4" },
  },
});

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
