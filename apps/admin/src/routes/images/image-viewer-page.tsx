import { useNavigate, useParams } from "@tanstack/react-router";
import {
  memo,
  type ReactNode,
  type RefObject,
  use,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import { ImageViewerActions } from "./image-viewer-actions";
import { ImageVisitContext } from "./image-viewer-context";
import { ImageVisitProvider } from "./image-visit-provider";
import { useViewerNavigation } from "./use-viewer-navigation";

import { useImageNeighbors } from "@/features/images/detail/hooks/use-image-neighbors";
import { ImageDetail } from "@/features/images/detail/image-detail";
import {
  keepNeighborLinks,
  type NeighborIds,
  viewerProgress,
} from "@/features/images/detail/logic/viewer-progress";
import { ViewerFrame, ViewerMessage } from "@/features/images/ui/viewer-frame";
import { ViewerVisit } from "@/features/images/ui/viewer-visit";
import { Heading, PageTransition, Text } from "@/ui/layout";
import { ErrorState, LoadingState } from "@/ui/patterns";
import { Link } from "@/ui/primitives/navigation";
import { Notice } from "@/ui/primitives/notice";

type BackProps = {
  /** 一覧へ戻るリンク。 */
  back: RefObject<HTMLAnchorElement | null>;
};

const PhotoVisitContent = ({ back }: BackProps): ReactNode => {
  const state = use(ImageVisitContext);
  const id = state?.id ?? "";
  const { t } = useTranslation();
  const navigate = useNavigate();
  const currentNeighbors = useImageNeighbors(id);

  const progress = viewerProgress({
    id,
    shownId: state?.shown?.id,
    status: state?.query._tag ?? "Loading",
    hasNeighbors: currentNeighbors !== undefined,
  });

  const [lastLinks, setLastLinks] = useState<NeighborIds>();

  const links = keepNeighborLinks(
    lastLinks,
    progress.canMove ? currentNeighbors : undefined,
  );

  if (links !== lastLinks) setLastLinks(links);

  const navigation = useViewerNavigation(back, {
    ...links,
    disabled: !progress.canMove,
  });

  if (state === undefined) return null;

  const { shown, pending, query, direction, settle } = state;
  const failure = progress.canMove ? currentNeighbors?.failure : undefined;

  const error =
    query._tag === "Failed" ? (
      <ErrorState
        retryRef={navigation.retryRef}
        isRetrying={query.isRetrying}
        layout={shown === undefined ? "screen" : "inline"}
        level={shown === undefined ? 1 : 2}
        onRetry={() => {
          navigation.retry(id, query.retry);
        }}
        title={t("imageDetail.loadFailed")}
      />
    ) : undefined;

  return (
    <ViewerVisit
      ref={(element) => {
        if (element !== null && progress.ready) navigation.restore(id);
      }}
    >
      {shown !== undefined && (
        <ImageDetail
          navigationError={
            failure && (
              <ErrorState
                layout="inline"
                level={2}
                retryRef={navigation.retryRef}
                isRetrying={failure.isRetrying}
                onRetry={() => {
                  navigation.retry(id, failure.retry);
                }}
                title={t("imageDetail.neighborsFailed")}
              />
            )
          }
          image={shown}
          error={error}
          pending={pending}
          waiting={progress.waiting && t(progress.waiting)}
          direction={shown.id === id ? direction : undefined}
          onSettled={settle}
          next={navigation.next}
          previous={navigation.previous}
          onMove={(href) => {
            void navigate({ href });
          }}
        />
      )}
      {query._tag === "Loading" && shown === undefined && (
        <LoadingState layout="media" label={t("imageDetail.loading")} />
      )}
      {error !== undefined && shown === undefined && (
        <ViewerMessage>{error}</ViewerMessage>
      )}
      {query._tag === "Loaded" && shown === undefined && (
        <ViewerMessage>
          <Notice tone="warning">
            <Heading level={1} variant="section">
              {t("imageDetail.gone")}
            </Heading>
          </Notice>
        </ViewerMessage>
      )}
    </ViewerVisit>
  );
};

const ViewerBack = ({ back }: BackProps): ReactNode => {
  const { t } = useTranslation();

  return (
    <Text variant="caption">
      <Link ref={back} href="/images" variant="back">
        {t("imageDetail.backToList")}
      </Link>
    </Text>
  );
};

/** 写真の切り替えをまたいで、ビューアの帯と一覧へのリンクを保つ。 */
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

const ViewerScreen = memo(ViewerScreenContent);

/** ナビの外に置く写真のビューア。 */
export const ImageViewerPage = (): ReactNode => {
  const id = useParams({
    from: "/images/$id",
    select: (params) => params.id.toLowerCase(),
  });

  return (
    <ImageVisitProvider id={id}>
      <ViewerScreen />
    </ImageVisitProvider>
  );
};
