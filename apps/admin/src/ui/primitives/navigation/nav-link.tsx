import type { ReactNode } from "react";
import { Link as AriaLink } from "react-aria-components";

import { Icon, type IconName } from "@/ui/primitives/graphics";
import type { Href } from "@/ui/primitives/navigation";
import { navItem } from "@/ui/primitives/navigation/nav-item-style";
import { typography } from "@/ui/typography";

/** ナビのリンクに渡す値。 */
export type NavLinkProps = {
  /** 管理画面の中の行き先。 */
  href: Href;
  /** リンクの文言。 */
  children: ReactNode;
  /** リンクに添えるアイコン。 */
  icon: IconName;
  /** 今いる画面へのリンクか。 */
  isCurrent: boolean;
  /** 押したときに呼ぶ関数。 */
  onPress?: (() => void) | undefined;
};

/** ナビのリンク。 */
export const NavLink = ({
  href,
  children,
  icon,
  isCurrent,
  onPress,
}: NavLinkProps): ReactNode => (
  <AriaLink
    aria-current={isCurrent ? "page" : false}
    className={navItem({
      current: isCurrent,
      className: typography({ role: isCurrent ? "label" : "body" }),
    })}
    href={href}
    onPress={() => onPress?.()}
  >
    <Icon name={icon} />
    <span className="min-w-0 truncate">{children}</span>
  </AriaLink>
);
