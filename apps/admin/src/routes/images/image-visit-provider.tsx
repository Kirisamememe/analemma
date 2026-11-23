import { type ReactNode, useMemo } from "react";

import {
  ImageVisitContext,
  type ViewerTarget,
  ViewerTargetContext,
} from "./image-viewer-context";
import { useImageVisit } from "./use-image-visit";

/** 写真を見る画面の状態を持つ範囲に渡す値。 */
type ImageVisitProviderProps = {
  /** URL の画像の ID。 */
  id: string;
  /** 状態を読む部品(帯と写真)。 */
  children: ReactNode;
};

/** URL の画像を読み、写真の切り替えの状態と、帯の操作が使う画像を、別々に渡す。 */
export const ImageVisitProvider = ({
  id,
  children,
}: ImageVisitProviderProps): ReactNode => {
  const visit = useImageVisit(id);
  const { shown } = visit;
  const isDisabled = shown?.id !== id || visit.query._tag !== "Loaded";

  const target = useMemo<ViewerTarget | undefined>(
    () => (shown === undefined ? undefined : { image: shown, isDisabled }),
    [shown, isDisabled],
  );

  return (
    <ImageVisitContext value={visit}>
      <ViewerTargetContext value={target}>{children}</ViewerTargetContext>
    </ImageVisitContext>
  );
};
