import { useNavigate, useParams } from "@tanstack/react-router";
import { memo, type ReactNode, type RefObject, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { ImageViewerActions } from "./image-viewer-actions";
import { useViewerNavigation } from "./use-viewer-navigation";

import { useImageNeighbors } from "@/features/images/detail/hooks/use-image-neighbors";
import { useViewerImage } from "@/features/images/detail/hooks/use-viewer-image";
import { ImageDetail } from "@/features/images/detail/image-detail";
import { ViewerFrame, ViewerMessage } from "@/features/images/ui/image-viewer";
import { ViewerVisit } from "@/features/images/ui/viewer-visit";
import { Heading, PageTransition, Text } from "@/ui/layout";
import { ErrorState, LoadingState } from "@/ui/patterns";
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

const PhotoVisitContent = ({ back }: BackProps): ReactNode => {
  const id = useParams({
    from: "/images/$id",
    select: (params) => params.id.toLowerCase(),
  });

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
                retryRef={navigation.retryRef}
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
      {query._tag === "Loading" && (
        <LoadingState layout="media" label={t("imageDetail.loading")} />
      )}
      {query._tag === "Failed" && (
        <ViewerMessage>
          <ErrorState
            retryRef={navigation.retryRef}
            isRetrying={query.isRetrying}
            layout="screen"
            level={1}
            onRetry={() => {
              navigation.retry(id, query.retry);
            }}
            title={t("imageDetail.loadFailed")}
          />
        </ViewerMessage>
      )}
      {query._tag === "Loaded" && image === undefined && (
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
