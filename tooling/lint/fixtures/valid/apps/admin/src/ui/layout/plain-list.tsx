import type { ReactNode } from "react";

/** `PlainList` に渡す値。 */
type PlainListProps = {
  /** 一覧の項目。 */
  readonly children: ReactNode;
};

/** マーカーを消した一覧。 */
export const PlainList = ({ children }: PlainListProps): ReactNode => (
  <ul className="list-none" role="list">
    {children}
  </ul>
);
