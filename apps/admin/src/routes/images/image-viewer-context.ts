import { createContext } from "react";

import type { useImageVisit } from "./use-image-visit";

import type { AdminImage } from "@/features/images/detail/queries/image-query";

/** 写真を見る画面の、取得と写真の切り替えの状態(写真と情報の欄が読む)。 */
export const ImageVisitContext = createContext<
  ReturnType<typeof useImageVisit> | undefined
>(undefined);

/** 帯の操作が使う、表示中の画像と、操作を受け付けるか。 */
export type ViewerTarget = {
  /** 表示中の画像。 */
  readonly image: AdminImage;
  /** 次の写真を待っていて、操作を受け付けないか。 */
  readonly isDisabled: boolean;
};

/** 帯の操作が読む画像(表示中の画像か、受け付けるかが変わったときだけ替わる)。 */
export const ViewerTargetContext = createContext<ViewerTarget | undefined>(
  undefined,
);
