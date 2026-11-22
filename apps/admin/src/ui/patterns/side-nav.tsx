import { type ReactNode, useId, useState } from "react";

import { AppMark } from "@/ui/primitives/graphics";
import {
  NavDrawer,
  NavLink,
  type NavLinkProps,
} from "@/ui/primitives/navigation";
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

/** ナビのリンクのまとまり。 */
type SideNavGroup = {
  /** まとまりの見出し。 */
  readonly heading?: string | undefined;
  /** まとまりのリンク。 */
  readonly items: readonly SideNavItem[];
};

/** ナビに渡す値。 */
type SideNavProps = {
  /** アプリの名前。 */
  readonly appName: string;
  /** ナビの名前。 */
  readonly label: string;
  /** drawer の Dialog の名前。 */
  readonly drawerLabel: string;
  /** drawer の操作を送信中か。 */
  readonly isDrawerPending?: boolean;
  /** ナビのリンクのまとまり。 */
  readonly groups: readonly SideNavGroup[];
  /** 下の段に置く操作。 */
  readonly footer: ReactNode;
};

/** ナビの中身に渡す値。 */
type SideNavContentProps = Pick<SideNavProps, "label" | "groups" | "footer"> & {
  /** リンクを押したときに呼ぶ関数。 */
  readonly onPress?: (() => void) | undefined;
};

/** ナビのリンクのまとまりに渡す値。 */
type SideNavGroupProps = SideNavGroup & Pick<SideNavContentProps, "onPress">;

const NavGroup = ({
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

const SideNavContent = ({
  label,
  groups,
  footer,
  onPress,
}: SideNavContentProps): ReactNode => (
  <>
    <nav aria-label={label} className="flex flex-col gap-4 px-3 pt-1 pb-3">
      {groups.map(({ heading, items }) => (
        <NavGroup
          heading={heading}
          items={items}
          key={items[0]?.href ?? heading}
          onPress={onPress}
        />
      ))}
    </nav>
    <div className="mt-auto p-3">{footer}</div>
  </>
);

/** 広い画面に置くナビと、狭い画面で引き出すナビ。 */
export const SideNav = ({
  appName,
  label,
  drawerLabel,
  isDrawerPending = false,
  groups,
  footer,
}: SideNavProps): ReactNode => {
  const [isOpen, setIsOpen] = useState(false);
  const heading = (
    <p
      className={typography({
        role: "section",
        className: "flex min-w-0 items-center gap-2",
      })}
    >
      <AppMark />
      <span className="truncate">{appName}</span>
    </p>
  );

  return (
    <>
      <aside className="sticky top-0 hidden h-dvh w-sidebar shrink-0 flex-col overflow-y-auto md:flex">
        <div className="flex h-nav-bar shrink-0 items-center px-6">
          {heading}
        </div>
        <SideNavContent footer={footer} groups={groups} label={label} />
      </aside>
      <header
        data-top-bar=""
        className="sticky top-0 z-sticky flex h-nav-bar shrink-0 items-center gap-2 bg-surface-sunken px-3 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:border-b after:border-line md:hidden"
      >
        <NavDrawer
          heading={heading}
          isOpen={isOpen}
          isPending={isDrawerPending}
          label={drawerLabel}
          onOpenChange={setIsOpen}
        >
          <SideNavContent
            footer={footer}
            groups={groups}
            label={label}
            onPress={() => {
              setIsOpen(false);
            }}
          />
        </NavDrawer>
        {heading}
      </header>
    </>
  );
};
