import { type ReactNode, useId } from "react";

import { NavLink, type NavLinkProps } from "@/ui/primitives/navigation";
import { typography } from "@/ui/typography";

/** ナビのリンクの行き先と文言。 */
type SideNavItem = {
  /** 管理画面の中の行き先。 */
  readonly href: NavLinkProps["href"];
  /** リンクの文言。 */
  readonly label: string;
  /** リンクに添えるアイコン。 */
  readonly icon: NavLinkProps["icon"];
  /** 今いる画面へのリンクか。 */
  readonly isCurrent: boolean;
};

/** ナビのリンクのまとまりに渡す値。 */
export type SideNavGroupProps = {
  /** まとまりの見出し。 */
  readonly heading?: string | undefined;
  /** まとまりのリンク。 */
  readonly items: readonly SideNavItem[];
  /** リンクを押したときに呼ぶ関数。 */
  readonly onPress?: (() => void) | undefined;
};

/** ナビのリンクのまとまり。 */
export const SideNavGroup = ({
  heading,
  items,
  onPress,
}: SideNavGroupProps): ReactNode => {
  const headingId = useId();

  return (
    <div className="flex flex-col gap-1">
      {heading !== undefined && (
        <p
          className={typography({
            role: "caption",
            className: "px-3 text-fg-muted",
          })}
          id={headingId}
        >
          {heading}
        </p>
      )}
      <ul
        aria-labelledby={heading === undefined ? undefined : headingId}
        className="flex flex-col gap-0.5"
      >
        {items.map((item) => (
          <li key={item.href}>
            <NavLink
              href={item.href}
              icon={item.icon}
              isCurrent={item.isCurrent}
              onPress={onPress}
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
};
