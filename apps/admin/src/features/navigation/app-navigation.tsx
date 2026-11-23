import type { ReactNode } from "react";

import { LocaleSelect, ThemeSelect } from "@/features/preferences";
import { LogOutButton, useLogOut } from "@/features/session";
import { type MessageKey, useTranslate } from "@/i18n/use-translate";
import { SideNav } from "@/ui/patterns";
import type { NavLinkProps } from "@/ui/primitives/navigation";

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
    heading: "navigation.content",
    items: [
      { href: "/fixed-pages", label: "fixedPages.title", icon: "file-text" },
      { href: "/images", label: "images.title", icon: "image" },
    ],
  },
  {
    heading: "navigation.settings",
    items: [
      { href: "/security", label: "security.title", icon: "shield-check" },
      {
        href: "/deploy-tokens",
        label: "deployTokens.title",
        icon: "key-round",
      },
    ],
  },
];

/** ログインした後の画面のナビに渡す値。 */
type AppNavigationProps = {
  /** 今いる画面へのリンクかを返す関数。 */
  isCurrent: (href: NavigationLink["href"]) => boolean;
};

/** ログインした後の画面のナビ。 */
export const AppNavigation = ({ isCurrent }: AppNavigationProps): ReactNode => {
  const t = useTranslate();
  const logOut = useLogOut();

  return (
    <SideNav
      appName={t("app.name")}
      drawerLabel={t("navigation.drawer")}
      footer={
        <>
          <LocaleSelect />
          <ThemeSelect />
          <LogOutButton logOut={logOut} />
        </>
      }
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
