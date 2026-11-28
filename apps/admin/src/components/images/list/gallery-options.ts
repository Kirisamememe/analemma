import type { ReactNode } from "react";

import type { ImageSummary } from "@/queries/images-query";
import type { Href } from "@/ui/primitives/navigation";

/** 一覧のタイルの見せ方と、選ぶための入力欄。 */
export type GalleryOptions = {
  /** 1枚の選択用に写真全体を見せるか。 */
  singleChoice?: boolean | undefined;
  /** 画像を見る画面への行き先を返す関数。 */
  imageHref?: ((id: string) => Href) | undefined;
  /** 写真を選ぶときの入力欄。 */
  renderChoice?:
    | ((
        image: ImageSummary,
        focus: (element: HTMLElement | null) => void,
      ) => ReactNode)
    | undefined;
};
