import { useNavigate, useParams, useRouter } from "@tanstack/react-router";
import { type KeyboardEvent, type ReactNode, useRef } from "react";
import { useTranslation } from "react-i18next";

import { useAppContext } from "@/api/app-context";
import { useApiQuery } from "@/api/server-state/server-state";
import { DeleteImage } from "@/features/images/detail/delete-image";
import { EditImage } from "@/features/images/detail/edit-image";
import { useImageNeighbors } from "@/features/images/detail/hooks/use-image-neighbors";
import { ImageDetail } from "@/features/images/detail/image-detail";
import { PublicationButton } from "@/features/images/detail/publication-button";
import {
  imageQueryKey,
  loadImage,
} from "@/features/images/detail/queries/image-query";
import {
  ViewerFrame,
  ViewerLoading,
  ViewerMessage,
} from "@/features/images/ui/image-viewer";
import { Text } from "@/ui/layout";
import { ErrorState } from "@/ui/patterns";
import { Link } from "@/ui/primitives/navigation";
import { Notice } from "@/ui/primitives/notice";
import type { AppHref } from "@/ui/primitives/ui-provider";

type PhotoMove = {
  /** 移動先の写真の ID。 */
  id: string;
  /** 一覧の次の画像へ進んだか。 */
  forward: boolean;
};

const hrefOf = (id: string | undefined): AppHref | undefined =>
  id === undefined ? undefined : `/images/${id}`;

/** 1枚の画像を、暗い地に大きく見せる画面。 */
export const ImageViewerPage = (): ReactNode => {
  const { api } = useAppContext();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const router = useRouter();
  const { id } = useParams({ from: "/images/$id" });
  const neighbors = useImageNeighbors(id);

  const query = useApiQuery({
    key: imageQueryKey(id),
    load: () => loadImage(api, id),
  });

  const pending = useRef<PhotoMove>(undefined);

  const rememberFocus = (event: KeyboardEvent<HTMLElement>): void => {
    if (event.key !== "Enter" || !(event.target instanceof HTMLAnchorElement)) {
      return;
    }

    const selected = event.target.pathname;

    if (!selected.startsWith("/images/")) return;

    const target = selected.slice("/images/".length);

    pending.current = { id: target, forward: target === neighbors.next };
  };

  const restoreFocus = (element: HTMLElement | null): void => {
    const move = pending.current;

    if (element === null || move?.id !== id || query._tag === "Loading") return;

    if (document.activeElement !== document.body) {
      pending.current = undefined;
      return;
    }

    const facing = move.forward ? neighbors.next : neighbors.previous;
    const other = move.forward ? neighbors.previous : neighbors.next;
    const destination = facing ?? other;

    if (
      destination === undefined &&
      neighbors.failure === undefined &&
      query._tag === "Loaded" &&
      query.data._tag === "Succeeded"
    ) {
      return;
    }

    const href = hrefOf(destination) ?? "/images";

    const link = Array.from(element.querySelectorAll("a")).find(
      (candidate) => candidate.pathname === href,
    );

    if (link !== undefined) {
      pending.current = undefined;
      link.focus();
    }
  };

  const back = (
    <Text variant="caption">
      <Link href="/images" variant="back">
        {t("imageDetail.backToList")}
      </Link>
    </Text>
  );

  const content =
    query._tag === "Loaded" && query.data._tag === "Succeeded" ? (
      <ImageDetail
        actions={
          <>
            <EditImage image={query.data.data} />
            <PublicationButton image={query.data.data} />
            <DeleteImage
              id={query.data.data.id}
              name={query.data.data.title ?? t("imageDetail.untitled")}
              onDeleted={(deletedId) => {
                if (
                  router.state.location.pathname
                    .toLowerCase()
                    .replace(/\/+$/v, "") === `/images/${deletedId}`
                ) {
                  void navigate({ to: "/images" });
                }
              }}
            />
          </>
        }
        navigationError={
          neighbors.failure && (
            <ErrorState
              layout="inline"
              level={2}
              isRetrying={neighbors.failure.isRetrying}
              onRetry={() => {
                pending.current = { id, forward: true };
                neighbors.failure?.retry();
              }}
              title={t("imageDetail.neighborsFailed")}
            />
          )
        }
        key={id}
        back={back}
        image={query.data.data}
        next={hrefOf(neighbors.next)}
        onMove={(href) => {
          void navigate({ href });
        }}
        previous={hrefOf(neighbors.previous)}
      />
    ) : (
      <ViewerFrame back={back}>
        {query._tag === "Loading" ? (
          <ViewerLoading />
        ) : (
          <ViewerMessage>
            {query._tag === "Failed" && (
              <ErrorState
                isRetrying={query.isRetrying}
                layout="screen"
                level={2}
                onRetry={() => {
                  pending.current = { id, forward: true };
                  query.retry();
                }}
                title={t("imageDetail.loadFailed")}
              />
            )}
            {query._tag === "Loaded" && (
              <Notice tone="warning">{t("imageDetail.gone")}</Notice>
            )}
          </ViewerMessage>
        )}
      </ViewerFrame>
    );

  return (
    <main onKeyDownCapture={rememberFocus} ref={restoreFocus}>
      {content}
    </main>
  );
};
