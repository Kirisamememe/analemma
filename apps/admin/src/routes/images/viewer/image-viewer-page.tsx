import { useParams } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { ImageViewerContext } from "./image-viewer-context";
import { useImageVisit } from "./use-image-visit";
import { ViewerScreen } from "./viewer-screen";

/** ナビの外に置く写真のビューア。 */
export const ImageViewerPage = (): ReactNode => {
  const id = useParams({
    from: "/images/$id",
    select: (params) => params.id.toLowerCase(),
  });

  const state = useImageVisit(id);

  return (
    <ImageViewerContext value={state}>
      <ViewerScreen />
    </ImageViewerContext>
  );
};
