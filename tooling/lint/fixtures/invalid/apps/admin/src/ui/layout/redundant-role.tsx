import type { ReactNode } from "react";

/** `Steps` に渡す値。 */
type StepsProps = {
  /** 手順の項目。 */
  readonly children: ReactNode;
};

/** 要素が元から持つ role を書いた、番号付きの一覧。 */
export const Steps = ({ children }: StepsProps): ReactNode => (
  <ol role="list">{children}</ol>
);
