import { useMatchRoute, useRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { LocaleSelect, ThemeSelect } from "@/features/preferences";
import { LogOutButton, useLogOut } from "@/features/session";
import type { MessageKey } from "@/i18n/use-translate";
import { SideNav } from "@/ui/patterns";
import type { NavLinkProps } from "@/ui/primitives/navigation";

/** 管理画面のナビのリンクの定義。 */
type NavigationLink = Pick<NavLinkProps, "icon"> & {
  /** 行き先の画面の route のパス。 */
  readonly to: string;
  /** リンクの文言の訳のキー。 */
  readonly label: MessageKey;
};

/** 管理画面のナビのリンクのまとまり。 */
type NavigationGroup = {
  /** 見出しの訳のキー。 */
  readonly heading: MessageKey | undefined;
  /** まとまりのリンクの定義。 */
  readonly items: readonly NavigationLink[];
};

const GROUPS = [
  {
    heading: undefined,
    items: [{ to: "/", label: "home.title", icon: "house" }],
  },
  {
    heading: "navigation.content",
    items: [
      { to: "/fixed-pages", label: "fixedPages.title", icon: "file-text" },
      { to: "/images", label: "images.title", icon: "image" },
    ],
  },
  {
    heading: "navigation.settings",
    items: [
      { to: "/security", label: "security.title", icon: "shield-check" },
      { to: "/deploy-tokens", label: "deployTokens.title", icon: "key-round" },
    ],
  },
] as const satisfies readonly NavigationGroup[];

/** ログインした後の画面のナビ。 */
export const AppNavigation = (): ReactNode => {
  const { t } = useTranslation();
  const logOut = useLogOut();
  const router = useRouter();
  const matchRoute = useMatchRoute();

  const groups = GROUPS.map(({ heading, items }) => ({
    heading: heading === undefined ? undefined : t(heading),
    items: items.map(({ to, label, icon }) => ({
      href: router.buildLocation({ to }).href,
      label: t(label),
      icon,
      isCurrent: matchRoute({ to, fuzzy: to !== "/" }) !== false,
    })),
  }));

  return (
    <SideNav
      appName={t("app.name")}
      drawerCloseLabel={t("ui.closeNav")}
      drawerLabel={t("navigation.drawer")}
      drawerOpenLabel={t("ui.openNav")}
      footer={
        <>
          <LocaleSelect />
          <ThemeSelect />
          <LogOutButton logOut={logOut} />
        </>
      }
      groups={groups}
      isDrawerPending={logOut.isPending}
      label={t("navigation.main")}
    />
  );
};
