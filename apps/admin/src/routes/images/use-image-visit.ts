import { useCallback, useState } from "react";

import { useViewerImage } from "@/features/images/detail/hooks/use-viewer-image";
import {
  followVisit,
  loadedImage,
  settleVisit,
  visitPhotos,
} from "@/features/images/detail/logic/image-visit";

/** URL と表示中の写真を照らし合わせ、次の写真の準備を待つ。 */
export const useImageVisit = (id: string) => {
  const query = useViewerImage(id);
  const latest = loadedImage(query);
  const [visit, setVisit] = useState(() => followVisit({ id }, { id, latest }));

  const followed = followVisit(visit, { id, latest });

  if (followed !== visit) setVisit(followed);

  const settle = useCallback((photoId: string) => {
    setVisit((current) => settleVisit(current, photoId));
  }, []);

  return {
    id,
    direction: followed.direction,
    ...visitPhotos(followed, { status: query._tag, latest }),
    query,
    settle,
  };
};
