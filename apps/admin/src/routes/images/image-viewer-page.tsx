import { useNavigate, useParams } from "@tanstack/react-router";
import { memo, type ReactNode, type RefObject, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { ImageViewerActions } from "./image-viewer-actions";

import { useImageNeighbors } from "@/features/images/detail/hooks/use-image-neighbors";
import { useViewerImage } from "@/features/images/detail/hooks/use-viewer-image";
import { ImageDetail } from "@/features/images/detail/image-detail";
import {
  type Neighbor,
  ViewerFrame,
  ViewerMessage,
} from "@/features/images/ui/image-viewer";
import { ViewerLoading } from "@/features/images/ui/viewer-loading";
import { ViewerVisit } from "@/features/images/ui/viewer-visit";
import { PageTransition, Text } from "@/ui/layout";
import { ErrorState } from "@/ui/patterns";
import { Link } from "@/ui/primitives/navigation";
import { Notice } from "@/ui/primitives/notice";

type PhotoVisit = {
  /** 表示する写真の ID。 */
  id: string;
  /** 一覧を新しい順に並べたときの移動方向。 */
  direction?: "previous" | "next";
};

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

const useViewerNavigation = (back: BackProps["back"]) => {
  const { t } = useTranslation();
  const previous = useRef<HTMLAnchorElement>(null);
  const next = useRef<HTMLAnchorElement>(null);
  const pending = useRef<PendingFocus>(undefined);
  const links = { previous, next };

  const neighbor = (
    side: PhotoSide,
    id: string | undefined,
  ): Neighbor | undefined =>
    id === undefined
      ? undefined
      : {
          href: `/images/${id}`,
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

    pending.current = undefined;
    const active = document.activeElement;

    if (active !== null && active !== document.body) return;

    const opposite = move.side === "previous" ? next : previous;
    (links[move.side].current ?? opposite.current ?? back.current)?.focus();
  };

  const retry = (id: string, again: () => void) => {
    pending.current = { id, side: "next" };
    again();
  };

  return { neighbor, restore, retry };
};

const PhotoVisitContent = ({ back }: BackProps): ReactNode => {
  const { id } = useParams({ from: "/images/$id" });
  const { t } = useTranslation();
  const navigation = useViewerNavigation(back);
  const navigate = useNavigate();
  const neighbors = useImageNeighbors(id);
  const query = useViewerImage(id);
  const failure = neighbors?.failure;
  const [visit, setVisit] = useState<PhotoVisit>({ id });

  if (visit.id !== id) {
    setVisit({ id, direction: id < visit.id ? "next" : "previous" });
  }

  const image =
    query._tag === "Loaded" && query.data._tag === "Succeeded"
      ? query.data.data
      : undefined;

  const ready =
    query._tag !== "Loading" &&
    (image === undefined || neighbors !== undefined);

  return (
    <ViewerVisit
      direction={visit.direction}
      ref={(element) => {
        if (element !== null && ready) navigation.restore(id);
      }}
    >
      {image !== undefined && (
        <ImageDetail
          key={id}
          navigationError={
            failure && (
              <ErrorState
                layout="inline"
                level={2}
                isRetrying={failure.isRetrying}
                onRetry={() => {
                  navigation.retry(id, failure.retry);
                }}
                title={t("imageDetail.neighborsFailed")}
              />
            )
          }
          image={image}
          next={navigation.neighbor("next", neighbors?.next)}
          previous={navigation.neighbor("previous", neighbors?.previous)}
          onMove={(href) => {
            void navigate({ href });
          }}
        />
      )}
      {query._tag === "Loading" && <ViewerLoading />}
      {query._tag === "Failed" && (
        <ViewerMessage>
          <ErrorState
            isRetrying={query.isRetrying}
            layout="screen"
            level={2}
            onRetry={() => {
              navigation.retry(id, query.retry);
            }}
            title={t("imageDetail.loadFailed")}
          />
        </ViewerMessage>
      )}
      {query._tag === "Loaded" && image === undefined && (
        <ViewerMessage>
          <Notice tone="warning">{t("imageDetail.gone")}</Notice>
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
const ViewerScreen = (): ReactNode => {
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

/** ナビの外に置く写真のビューア。 */
export const ImageViewerPage = memo(ViewerScreen);
