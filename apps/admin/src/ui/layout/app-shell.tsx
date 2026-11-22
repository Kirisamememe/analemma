import type { ReactNode } from "react";

import { tv } from "../tv";

const shell = tv({
  slots: {
    screen: "min-h-dvh bg-canvas text-fg",
    frame: "contents",
    main: "py-8",
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
  readonly nav?: ReactNode;
  /** 画面の中身。 */
  readonly children: ReactNode;
};

/** 画面の地と、中身の上下の余白を持つ骨組み。 */
export const AppShell = ({ nav, children }: AppShellProps): ReactNode => {
  const { screen, frame, main } = shell({ withNav: Boolean(nav) });

  return (
    <div className={screen()}>
      {nav}
      <div className={frame()}>
        <main className={main()}>{children}</main>
      </div>
    </div>
  );
};
