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
import { ImageViewerContext } from "./image-viewer-context";
import { useImageVisit } from "./use-image-visit";

import {
  type ImageNeighbors,
  useImageNeighbors,
} from "@/features/images/detail/hooks/use-image-neighbors";
import { ImageDetail } from "@/features/images/detail/image-detail";
import type { Neighbor } from "@/features/images/ui/image-viewer";
import { ViewerFrame, ViewerMessage } from "@/features/images/ui/viewer-frame";
import { ViewerLoading } from "@/features/images/ui/viewer-loading";
import { ViewerVisit } from "@/features/images/ui/viewer-visit";
import { Heading, PageTransition, Text } from "@/ui/layout";
import { ErrorState } from "@/ui/patterns";
import { Link } from "@/ui/primitives/navigation";
import { Notice } from "@/ui/primitives/notice";

type BackProps = {
  /** 一覧へ戻るリンク。 */
  back: RefObject<HTMLAnchorElement | null>;
};

type PhotoSide = "previous" | "next";

type PendingFocus = {
  /** キーボードで開く写真の ID。 */
  id: string;
  /** 押したリンクの向き。 */
  side: PhotoSide;
};

const useViewerNavigation = (back: BackProps["back"], disabled: boolean) => {
  const { t } = useTranslation();
  const previous = useRef<HTMLAnchorElement>(null);
  const next = useRef<HTMLAnchorElement>(null);
  const pending = useRef<PendingFocus>(undefined);
  const retryRef = useRef<HTMLButtonElement>(null);
  const links = { previous, next };

  const neighbor = (
    side: PhotoSide,
    id: string | undefined,
  ): Neighbor | undefined =>
    id === undefined
      ? undefined
      : {
          href: `/images/${id}`,
          disabled,
          label: t(
            side === "next" ? "imageDetail.next" : "imageDetail.previous",
          ),
          attach: (element) => {
            links[side].current = element;
          },
          onKeyboardNavigate: () => {
            pending.current = { id, side };
          },
        };

  const restore = (id: string) => {
    const move = pending.current;

    if (move?.id !== id) return;

    const active = document.activeElement;

    if (active !== null && active !== document.body) {
      if (active !== retryRef.current) pending.current = undefined;

      return;
    }

    if (retryRef.current !== null) {
      retryRef.current.focus();
      return;
    }

    pending.current = undefined;

    const opposite = move.side === "previous" ? next : previous;
    (links[move.side].current ?? opposite.current ?? back.current)?.focus();
  };

  const retry = (id: string, again: () => void) => {
    if (pending.current?.id !== id) pending.current = { id, side: "next" };

    again();
  };

  return { neighbor, restore, retry, retryRef };
};

const PhotoVisitContent = ({ back }: BackProps): ReactNode => {
  const state = use(ImageViewerContext);

  const id = useParams({
    from: "/images/$id",
    select: (params) => params.id.toLowerCase(),
  });

  const { t } = useTranslation();
  const navigate = useNavigate();
  const currentNeighbors = useImageNeighbors(id);
  const canMove = state?.shown?.id === id && currentNeighbors !== undefined;
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
        if (element !== null && ready) navigation.restore(id);
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
          waiting={shown.id !== id}
          direction={shown.id === id ? direction : undefined}
          onSettled={settle}
          next={navigation.neighbor("next", neighbors?.next)}
          previous={navigation.neighbor("previous", neighbors?.previous)}
          onMove={(href) => {
            void navigate({ href });
          }}
        />
      )}
      {query._tag === "Loading" && shown === undefined && <ViewerLoading />}
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

  const state = useImageVisit(id);

  return (
    <ImageViewerContext value={state}>
      <ViewerScreen />
    </ImageViewerContext>
  );
};
