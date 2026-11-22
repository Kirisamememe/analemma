import type { ReactNode } from "react";

import { LogOutButton } from "@/features/session/log-out-button";
import { useLogOut } from "@/features/session/use-log-out";
import { type MessageKey, useTranslate } from "@/i18n/use-translate";
import { SideNav } from "@/ui/patterns/side-nav";
import type { NavLinkProps } from "@/ui/primitives/navigation/nav-item";

/** 管理画面のナビのリンクの定義。 */
type NavigationLink = Pick<NavLinkProps, "href" | "icon"> & {
  /** リンクの文言の訳のキー。 */
  readonly label: MessageKey;
};

/** 管理画面のナビのリンクのまとまり。 */
type NavigationGroup = {
  /** 見出しの訳のキー。 */
  readonly heading?: MessageKey;
  /** まとまりのリンクの定義。 */
  readonly items: readonly NavigationLink[];
};

const GROUPS: readonly NavigationGroup[] = [
  { items: [{ href: "/", label: "home.title", icon: "house" }] },
  {
    heading: "navigation.settings",
    items: [
      { href: "/security", label: "security.title", icon: "shield-check" },
    ],
  },
];

/** ログインした後の画面のナビに渡す値。 */
type AppNavigationProps = {
  /** 今いる画面へのリンクかを返す関数。 */
  readonly isCurrent: (href: NavigationLink["href"]) => boolean;
};

/** ログインした後の画面のナビ。 */
export const AppNavigation = ({ isCurrent }: AppNavigationProps): ReactNode => {
  const t = useTranslate();
  const logOut = useLogOut();

  return (
    <SideNav
      appName={t("app.name")}
      drawerLabel={t("navigation.drawer")}
      footer={<LogOutButton logOut={logOut} />}
      groups={GROUPS.map(({ heading, items }) => ({
        heading: heading === undefined ? undefined : t(heading),
        items: items.map(({ href, label, icon }) => ({
          href,
          label: t(label),
          icon,
          isCurrent: isCurrent(href),
        })),
      }))}
      isDrawerPending={logOut.isPending}
      label={t("navigation.main")}
    />
  );
};
