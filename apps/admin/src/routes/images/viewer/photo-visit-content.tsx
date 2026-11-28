import { useNavigate, useParams } from "@tanstack/react-router";
import { type ReactNode, type RefObject, use, useState } from "react";
import { useTranslation } from "react-i18next";

import { ImageViewerContext } from "./image-viewer-context";
import { useViewerNavigation } from "./use-viewer-navigation";

import {
  type ImageNeighbors,
  useImageNeighbors,
} from "@/features/images/detail/hooks/use-image-neighbors";
import { ImageDetail } from "@/features/images/detail/image-detail";
import { ViewerMessage } from "@/features/images/ui/viewer/viewer-message";
import { ViewerVisit } from "@/features/images/ui/viewer/viewer-visit";
import { Heading } from "@/ui/layout";
import { ErrorState, LoadingState } from "@/ui/patterns";
import { Notice } from "@/ui/primitives/notice";

/** 一覧へ戻るリンクを受け取る部品に渡す値。 */
type BackProps = {
  /** 一覧へ戻るリンク。 */
  back: RefObject<HTMLAnchorElement | null>;
};

/** 表示中の写真と情報、前後へのリンク、読み込みと失敗の知らせ。 */
export const PhotoVisitContent = ({ back }: BackProps): ReactNode => {
  const state = use(ImageViewerContext);

  const id = useParams({
    from: "/images/$id",
    select: (params) => params.id.toLowerCase(),
  });

  const { t } = useTranslation();
  const navigate = useNavigate();
  const currentNeighbors = useImageNeighbors(id);

  const canMove =
    state?.shown?.id === id &&
    state.query._tag === "Loaded" &&
    currentNeighbors !== undefined;

  const navigation = useViewerNavigation(back, !canMove);

  const [lastLinks, setLastLinks] =
    useState<Pick<ImageNeighbors, "previous" | "next">>();

  if (state === undefined) return null;

  const { shown, pending, query, direction, settle } = state;

  const neighbors = canMove ? currentNeighbors : lastLinks;
  const failure = canMove ? currentNeighbors.failure : undefined;

  if (
    canMove &&
    (currentNeighbors.next !== lastLinks?.next ||
      currentNeighbors.previous !== lastLinks?.previous)
  ) {
    setLastLinks({
      next: currentNeighbors.next,
      previous: currentNeighbors.previous,
    });
  }

  const ready =
    query._tag !== "Loading" &&
    (shown === undefined || canMove || query._tag === "Failed");

  const targets = {
    retry:
      query._tag === "Failed" || (failure !== undefined && shown !== undefined),
    previous: shown !== undefined && neighbors?.previous !== undefined,
    next: shown !== undefined && neighbors?.next !== undefined,
  }; // 変わると、focus を戻し直す

  const waiting = () => {
    if (query._tag === "Failed") return undefined;

    if (shown?.id !== id) return t("imageViewer.loading");

    if (query._tag === "Loading") return t("imageDetail.loadingInfo");

    if (currentNeighbors === undefined) {
      return t("imageDetail.loadingNeighbors");
    }

    return undefined;
  };

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

  const navigationError = failure && (
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
  );

  const shownDirection = shown?.id === id ? direction : undefined;
  const empty = shown === undefined ? query._tag : undefined; // 写真を出せていないときの、取得の状態

  return (
    <ViewerVisit
      ref={(element) => {
        if (element !== null && ready) navigation.restore(id, targets);
      }}
    >
      {shown !== undefined && (
        <ImageDetail
          navigationError={navigationError}
          image={shown}
          error={error}
          pending={pending}
          waiting={waiting()}
          direction={shownDirection}
          onSettled={settle}
          next={navigation.neighbor("next", neighbors?.next)}
          previous={navigation.neighbor("previous", neighbors?.previous)}
          onMove={(href) => {
            void navigate({ href });
          }}
        />
      )}
      {empty === "Loading" && (
        <LoadingState layout="media" label={t("imageDetail.loading")} />
      )}
      {empty === "Failed" && <ViewerMessage>{error}</ViewerMessage>}
      {empty === "Loaded" && (
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
