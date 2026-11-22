import type { ReactNode } from "react";
import {
  Button as AriaButton,
  Link as AriaLink,
  ProgressBar,
} from "react-aria-components";
import { useTranslation } from "react-i18next";

import type { LinkProps } from "./link";

import { Icon, type IconName } from "@/ui/primitives/graphics/icon";
import { Spinner } from "@/ui/primitives/graphics/spinner";
import { tv } from "@/ui/tv";
import { typography } from "@/ui/typography";

const navItem = tv({
  base: "relative flex h-control w-full items-center justify-start gap-2 rounded-control px-3 text-left text-fg-muted transition is-hovered:state-hover is-hovered:text-fg is-focus-shown:focus-ring is-pressed:state-pressed",
  variants: {
    current: {
      true: "bg-surface text-fg shadow-control after:pointer-events-none after:absolute after:inset-0 after:rounded-control after:outline after:outline-fg/10 forced-colors:after:outline-line is-hovered:after:outline-fg/20",
    },
  },
});

/** ナビのリンクに渡す値。 */
export type NavLinkProps = {
  /** 管理画面の中の行き先。 */
  readonly href: LinkProps["href"];
  /** リンクの文言。 */
  readonly children: ReactNode;
  /** リンクに添えるアイコン。 */
  readonly icon: IconName;
  /** 今いる画面へのリンクか。 */
  readonly isCurrent: boolean;
  /** 押したときに呼ぶ関数。 */
  readonly onPress?: (() => void) | undefined;
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
  readonly children: ReactNode;
  /** ボタンに添えるアイコン。 */
  readonly icon: IconName;
  /** 送信中か。 */
  readonly isPending?: boolean;
  /** 押したときに呼ぶ関数。 */
  readonly onPress?: () => void;
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
