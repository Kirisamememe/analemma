import type { ReactNode } from "react";

import { viewerStyle as style } from "./viewer-styles";

/** 写真を見る画面の真ん中に置く知らせに渡す値。 */
type ViewerMessageProps = {
  /** 知らせ(読み込み中・読み込めなかった欄など)。 */
  children: ReactNode;
};

/** 写真の代わりに、画面の真ん中に知らせを置く。 */
export const ViewerMessage = ({ children }: ViewerMessageProps): ReactNode => (
  <div className={style.message()}>{children}</div>
);
