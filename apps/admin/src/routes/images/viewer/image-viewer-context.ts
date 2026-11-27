import { createContext } from "react";

import type { useImageVisit } from "./use-image-visit";

/** ビューアの操作と表示が共有する写真。 */
export const ImageViewerContext = createContext<
  ReturnType<typeof useImageVisit> | undefined
>(undefined);
