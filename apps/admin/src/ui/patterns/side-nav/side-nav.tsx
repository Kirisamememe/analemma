import { type ReactNode, useState } from "react";

import { SideNavContent, type SideNavContentProps } from "./side-nav-content";

import { AppMark } from "@/ui/primitives/graphics";
import { NavDrawer } from "@/ui/primitives/navigation";
import { tv } from "@/ui/tv";
import { typography } from "@/ui/typography";

const sideNav = tv({
  slots: {
    sidebar: [
      "sticky top-0 h-dvh w-sidebar shrink-0 flex-col overflow-y-auto",
      "hidden md:flex",
    ],
    topBar: [
      "sticky top-0 z-sticky h-nav-bar shrink-0 items-center gap-2",
      "bg-surface-sunken px-3",
      "after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:separator-b",
      "flex md:hidden",
    ],
  },
});

const { sidebar, topBar } = sideNav();

/** ナビに渡す値。 */
type SideNavProps = Pick<SideNavContentProps, "label" | "groups" | "footer"> & {
  /** アプリの名前。 */
  appName: string;
  /** drawer の Dialog の名前。 */
  drawerLabel: string;
  /** drawer の操作を送信中か。 */
  isDrawerPending?: boolean;
};

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
      <aside className={sidebar()}>
        <div className="flex h-nav-bar shrink-0 items-center px-6">
          {heading}
        </div>
        <SideNavContent footer={footer} groups={groups} label={label} />
      </aside>
      <header data-top-bar="" className={topBar()}>
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
