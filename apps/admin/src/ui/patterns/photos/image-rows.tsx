import type { ReactNode, Ref } from "react";

import { rows } from "./image-rows-style";

/** 写真の行に渡す値。 */
type ImageRowsProps = {
  /** 一覧のアクセシブルな名前。 */
  label: string;
  /** 一覧の要素。 */
  listRef?: Ref<HTMLUListElement>;
  /** 並べるタイル(`ImageTile`)。 */
  children: ReactNode;
};

/** 写真の縦横比を保ったまま、高さをそろえて行の幅いっぱいに並べる一覧。 */
export const ImageRows = ({
  label,
  listRef,
  children,
}: ImageRowsProps): ReactNode => (
  // oxlint-disable-next-line jsx-a11y/no-redundant-roles -- WebKit はマーカーのない ul を group として読み上げる
  <ul aria-label={label} className={rows().list()} ref={listRef} role="list">
    {children}
  </ul>
);
