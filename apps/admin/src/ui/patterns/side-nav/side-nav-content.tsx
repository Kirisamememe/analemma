import type { ReactNode } from "react";

import { SideNavGroup, type SideNavGroupProps } from "./side-nav-group";

/** ナビの中身に渡す値。 */
export type SideNavContentProps = {
  /** ナビの名前。 */
  label: string;
  /** ナビのリンクのまとまり。 */
  groups: readonly Omit<SideNavGroupProps, "onPress">[];
  /** 下の段に、縦に並べる操作。 */
  footer: ReactNode;
  /** リンクを押したときに呼ぶ関数。 */
  onPress?: (() => void) | undefined;
};

/** ナビのリンクのまとまりと、下の段の操作。 */
export const SideNavContent = ({
  label,
  groups,
  footer,
  onPress,
}: SideNavContentProps): ReactNode => (
  <>
    <nav aria-label={label} className="flex flex-col gap-4 px-3 pt-1 pb-3">
      {groups.map(({ heading, items }) => (
        <SideNavGroup
          heading={heading}
          items={items}
          key={items[0]?.href ?? heading}
          onPress={onPress}
        />
      ))}
    </nav>
    <div className="mt-auto flex flex-col gap-0.5 p-3">{footer}</div>
  </>
);
