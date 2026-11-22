import { useMatchRoute } from "@tanstack/react-router";
import type { ParseKeysWithoutVariables } from "i18next";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { LogOutButton } from "@/features/session/log-out-button";
import { useLogOut } from "@/features/session/use-log-out";
import { SideNav } from "@/ui/patterns/side-nav";
import type { NavLinkProps } from "@/ui/primitives/navigation/nav-item";

/** 管理画面のナビのリンクの定義。 */
type NavigationLink = Pick<NavLinkProps, "href" | "icon"> & {
  /** リンクの文言の訳のキー。 */
  readonly label: ParseKeysWithoutVariables;
};

/** 管理画面のナビのリンクのまとまり。 */
type NavigationGroup = {
  /** 見出しの訳のキー。 */
  readonly heading?: ParseKeysWithoutVariables;
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

/** ログインした後の画面のナビ。 */
export const AppNavigation = (): ReactNode => {
  const { t } = useTranslation();
  const matchRoute = useMatchRoute();
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
          isCurrent: matchRoute({ to: href, fuzzy: href !== "/" }) !== false,
        })),
      }))}
      isDrawerPending={logOut.isPending}
      label={t("navigation.main")}
    />
  );
};
