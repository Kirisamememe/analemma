import { memo, type ReactNode, useRef } from "react";

import { ImageViewerActions } from "./image-viewer-actions";
import { PhotoVisitContent } from "./photo-visit-content";
import { ViewerBack } from "./viewer-back";

import { ViewerFrame } from "@/features/images/ui/viewer/viewer-frame";
import { PageTransition } from "@/ui/layout";

const ViewerScreenContent = (): ReactNode => {
  const back = useRef<HTMLAnchorElement>(null);
  return (
    <PageTransition>
      <ViewerFrame
        back={<ViewerBack back={back} />}
        actions={<ImageViewerActions />}
      >
        <PhotoVisitContent back={back} />
      </ViewerFrame>
    </PageTransition>
  );
};

/** 帯と一覧へのリンクを保ったまま、写真だけを切り替える画面。 */
export const ViewerScreen = memo(ViewerScreenContent);
