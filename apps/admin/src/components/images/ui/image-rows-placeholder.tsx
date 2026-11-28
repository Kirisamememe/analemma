import type { ReactNode } from "react";

import { rows } from "./image-rows-style";

import { LoadingState } from "@/ui/patterns";
import { Skeleton } from "@/ui/primitives/graphics";

const PLACEHOLDERS = [
  { key: "a", aspect: 1.5 },
  { key: "b", aspect: 0.67 },
  { key: "c", aspect: 1.5 },
  { key: "d", aspect: 1 },
  { key: "e", aspect: 1.78 },
  { key: "f", aspect: 0.75 },
  { key: "g", aspect: 1.5 },
  { key: "h", aspect: 1.5 },
  { key: "i", aspect: 0.67 },
  { key: "j", aspect: 1.5 },
] as const;

/** 写真の骨組みに渡す値。 */
type ImageRowsPlaceholderProps = {
  /** 読み込んでいることを伝える文言。 */
  label: string;
};

/** 一覧を読み込む間に、写真の形の灰色の枠を並べる骨組み。 */
export const ImageRowsPlaceholder = ({
  label,
}: ImageRowsPlaceholderProps): ReactNode => {
  const style = rows();

  return (
    <LoadingState layout="custom" label={label}>
      <ul aria-hidden="true" className={style.list()}>
        {PLACEHOLDERS.map(({ key, aspect }) => (
          <li
            className={style.item()}
            key={key}
            style={{ "--media-aspect": String(aspect) }}
          >
            <span className={style.body()}>
              <span className={style.frame()}>
                <Skeleton shape="media" width="full" />
              </span>
            </span>
          </li>
        ))}
      </ul>
    </LoadingState>
  );
};
