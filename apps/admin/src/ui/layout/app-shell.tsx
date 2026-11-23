import type { ReactNode } from "react";

import { PageTransition } from "./page-transition";

import { tv } from "@/ui/tv";

const shell = tv({
  slots: {
    screen: "min-h-dvh bg-canvas text-fg",
    frame: "contents",
    main: "@container py-8",
  },
  variants: {
    withNav: {
      true: {
        screen: "flex flex-col bg-surface-sunken md:flex-row",
        frame: "flex min-w-0 grow flex-col md:p-2 md:pl-0",
        main: "grow bg-surface px-2 md:rounded-surface md:px-4 md:shadow-control md:outline md:outline-fg/10",
      },
    },
  },
});

/** 画面の骨組みに渡す値。 */
type AppShellProps = {
  /** 画面のナビ。 */
  nav?: ReactNode;
  /** 画面ごとに変わる値(変わると、中身を描き直して、出る動きを始める)。 */
  pageKey?: string | undefined;
  /** 画面の中身。 */
  children: ReactNode;
};

/** 画面の地と、ナビと本文の並べ方と、中身の上下の余白と、中身が出る動きを持つ骨組み。 */
export const AppShell = ({
  nav,
  pageKey,
  children,
}: AppShellProps): ReactNode => {
  const { screen, frame, main } = shell({ withNav: Boolean(nav) });

  return (
    <div className={screen()}>
      {nav}
      <div className={frame()}>
        <main className={main()}>
          <PageTransition pageKey={pageKey}>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
};
