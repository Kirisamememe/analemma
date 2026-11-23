import type { ReactNode } from "react";
import {
  Button as AriaButton,
  Link as AriaLink,
  ProgressBar,
} from "react-aria-components";
import { useTranslation } from "react-i18next";

import { Icon, type IconName, Spinner } from "@/ui/primitives/graphics";
import { navItem } from "@/ui/primitives/navigation/nav-item-style";
import type { RoutePath } from "@/ui/primitives/ui-provider";
import { typography } from "@/ui/typography";

/** ナビのリンクに渡す値。 */
export type NavLinkProps = {
  /** 管理画面の中の行き先。 */
  href: RoutePath;
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

/** ナビのボタンに渡す値。 */
type NavButtonProps = {
  /** ボタンの文言。 */
  children: ReactNode;
  /** ボタンに添えるアイコン。 */
  icon: IconName;
  /** 送信中か。 */
  isPending?: boolean;
  /** 押したときに呼ぶ関数。 */
  onPress?: () => void;
};

/** ナビに置く操作のボタン。 */
export const NavButton = ({
  children,
  icon,
  isPending = false,
  onPress,
}: NavButtonProps): ReactNode => {
  const { t } = useTranslation();

  return (
    <AriaButton
      className={navItem({
        className: typography({
          role: "body",
          className: "is-pending:cursor-wait",
        }),
      })}
      isPending={isPending}
      onPress={() => onPress?.()}
    >
      <Icon name={icon} />
      <span className="min-w-0 truncate">{children}</span>
      {isPending && (
        <ProgressBar
          aria-label={t("ui.pending")}
          className="ml-auto shrink-0"
          isIndeterminate
        >
          <Spinner />
        </ProgressBar>
      )}
    </AriaButton>
  );
};
