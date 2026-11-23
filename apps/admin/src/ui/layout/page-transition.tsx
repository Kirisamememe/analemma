import type { ReactNode } from "react";

/** 画面の中身が出る動きに渡す値。 */
type PageTransitionProps = {
  /** 画面を見分ける値。 */
  pageKey?: string | undefined;
  /** 画面の中身。 */
  children: ReactNode;
};

/** 画面の中身を、下から浮かび上がらせて出す。 */
export const PageTransition = ({
  pageKey,
  children,
}: PageTransitionProps): ReactNode => (
  <div className="page-enter-animation" key={pageKey}>
    {children}
  </div>
);
