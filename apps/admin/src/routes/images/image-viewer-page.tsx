import { useNavigate, useParams } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { useAppContext } from "@/api/app-context";
import { useApiQuery } from "@/api/server-state/server-state";
import { useImageNeighbors } from "@/features/images/detail/hooks/use-image-neighbors";
import { ImageDetail } from "@/features/images/detail/image-detail";
import {
  imageQueryKey,
  loadImage,
} from "@/features/images/detail/queries/image-query";
import { ViewerFrame, ViewerMessage } from "@/features/images/ui/image-viewer";
import { Text } from "@/ui/layout";
import { ErrorState } from "@/ui/patterns";
import { Link } from "@/ui/primitives/navigation";
import { Notice } from "@/ui/primitives/notice";
import type { AppHref } from "@/ui/primitives/ui-provider";

const hrefOf = (id: string | undefined): AppHref | undefined =>
  id === undefined ? undefined : `/images/${id}`;

/** 1枚の画像を、暗い地に大きく見せる画面。 */
export const ImageViewerPage = (): ReactNode => {
  const { api } = useAppContext();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams({ from: "/images/$id" });
  const neighbors = useImageNeighbors(id);

  const query = useApiQuery({
    key: imageQueryKey(id),
    load: () => loadImage(api, id),
  });

  const back = (
    <Text variant="caption">
      <Link href="/images" variant="back">
        {t("imageDetail.backToList")}
      </Link>
    </Text>
  );

  if (query._tag === "Loaded" && query.data._tag === "Succeeded") {
    return (
      <ImageDetail
        back={back}
        image={query.data.data}
        next={hrefOf(neighbors.next)}
        onMove={(href) => {
          void navigate({ href });
        }}
        previous={hrefOf(neighbors.previous)}
      />
    );
  }

  return (
    <ViewerFrame back={back}>
      <ViewerMessage>
        {query._tag === "Loading" && (
          <Text tone="muted">{t("imageDetail.loading")}</Text>
        )}
        {query._tag === "Failed" && (
          <ErrorState
            isRetrying={query.isRetrying}
            layout="screen"
            level={2}
            onRetry={query.retry}
            title={t("imageDetail.loadFailed")}
          />
        )}
        {query._tag === "Loaded" && (
          <Notice tone="warning">{t("imageDetail.gone")}</Notice>
        )}
      </ViewerMessage>
    </ViewerFrame>
  );
};
