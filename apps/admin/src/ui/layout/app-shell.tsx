import type { ReactNode } from "react";

/** 画面の骨組みに渡す値。 */
type AppShellProps = {
  /** 画面の中身。 */
  readonly children: ReactNode;
};

/** 画面の地と、中身の上下の余白を持つ骨組み。 */
export const AppShell = ({ children }: AppShellProps): ReactNode => (
  <div className="min-h-dvh bg-canvas text-fg">
    <main className="py-8">{children}</main>
  </div>
);
