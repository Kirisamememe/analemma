import { memo, type ReactNode, useCallback, useRef } from "react";

import { useAppContext } from "@/api/app-context";
import {
  type NextPage,
  useApiInfiniteQuery,
} from "@/api/server-state/use-api-infinite-query";
import {
  type ImageSummary,
  IMAGES_QUERY_KEY,
  loadImagesPage,
} from "@/features/images/queries/images-query";
import {
  ImageRows,
  ImageRowsPlaceholder,
  ImageTile,
} from "@/features/images/ui/image-rows";
import { formatLocalDate } from "@/i18n/format-date-time";
import { useLocale, useTranslate } from "@/i18n/use-translate";
import { Stack } from "@/ui/layout";
import { EmptyState, ErrorState } from "@/ui/patterns";
import { Button } from "@/ui/primitives/button";
import type { AppHref } from "@/ui/primitives/ui-provider";

/** 続きを読む操作に渡す値。 */
type MoreProps = {
  /** 続きのページの状態。 */
  next: NextPage;
  /** 続きを読み始めたときに呼ぶ関数。 */
  onLoad: () => void;
  /** 再試行のボタンに focus を引き継ぐ関数。 */
  retryRef: (button: HTMLButtonElement | null) => void;
};

const More = ({ next, onLoad, retryRef }: MoreProps): ReactNode => {
  const t = useTranslate();

  if (next._tag === "None") return null;

  if (next._tag === "Failed") {
    return (
      <ErrorState
        isRetrying={next.isRetrying}
        layout="inline"
        level={2}
        onRetry={() => {
          onLoad();
          next.retry();
        }}
        retryRef={retryRef}
        title={t("images.moreFailed")}
      />
    );
  }

  return (
    <Stack align="center">
      <Button
        isPending={next.isLoading}
        onPress={() => {
          onLoad();
          next.load();
        }}
      >
        {t("images.loadMore")}
      </Button>
    </Stack>
  );
};

/** 画像の一覧に渡す値。 */
type ImagesSectionProps = {
  /** 画像を見る画面への行き先を返す関数。 */
  imageHref: (id: string) => AppHref;
};

type ImagePageProps = ImagesSectionProps & {
  /** 1ページ分の画像。 */
  images: readonly ImageSummary[];
  /** ページの番号。 */
  pageIndex: number;
  /** ページの最初のリンクを受け取る関数。 */
  onFirstLink: (pageIndex: number, link: HTMLAnchorElement | null) => void;
};

const PageTiles = ({
  images,
  imageHref,
  pageIndex,
  onFirstLink,
}: ImagePageProps): ReactNode => {
  const t = useTranslate();
  const locale = useLocale();

  return images.map((image, index) => (
    <ImageTile
      alt={image.alt}
      badge={image.published ? undefined : t("images.unpublished")}
      date={
        image.takenAt === null
          ? undefined
          : formatLocalDate(locale, image.takenAt)
      }
      href={imageHref(image.id)}
      images={image.deliveryImages}
      key={image.id}
      linkRef={
        index === 0
          ? (link) => {
              onFirstLink(pageIndex, link);
            }
          : undefined
      }
      missing={t("images.noDeliveryImage")}
      title={image.title}
      untitled={t("images.untitled")}
    />
  ));
};

const ImagePage = memo(PageTiles);

type PendingFocus = {
  /** 取得後に focus を渡すページの番号。 */
  page: number;
  /** 取得を始めたときの focus。 */
  from: Element | null;
};

/** 画像の一覧(新しく足した順)と、続きを読む操作。 */
export const ImagesSection = ({ imageHref }: ImagesSectionProps): ReactNode => {
  const t = useTranslate();
  const { api } = useAppContext();

  const pendingFocus = useRef<PendingFocus>(undefined);

  const rememberFocus = (page: number): void => {
    pendingFocus.current = { page, from: document.activeElement };
  };

  const focusResult = useCallback(
    (page: number, element: HTMLElement | null): void => {
      const pending = pendingFocus.current;

      if (
        element === null ||
        pending?.page !== page ||
        element === pending.from
      ) {
        return;
      }

      pendingFocus.current = undefined;
      const active = document.activeElement;

      if (
        active === pending.from ||
        (active === document.body && pending.from?.isConnected === false)
      ) {
        element.focus();
      }
    },
    [],
  );

  const query = useApiInfiniteQuery({
    key: IMAGES_QUERY_KEY,
    load: (cursor) => loadImagesPage(api, cursor),
    next: ({ nextCursor }) => nextCursor ?? undefined,
  });

  if (query._tag === "Loading") {
    return <ImageRowsPlaceholder label={t("images.loading")} />;
  }

  if (query._tag === "Failed") {
    return (
      <ErrorState
        isRetrying={query.isRetrying}
        layout="inline"
        level={2}
        onRetry={() => {
          rememberFocus(0);
          query.retry();
        }}
        title={t("images.loadFailed")}
      />
    );
  }

  if (!query.pages.some((page) => page.images.length > 0)) {
    return (
      <section
        aria-label={t("images.emptyTitle")}
        ref={(element) => {
          focusResult(0, element);
        }}
        tabIndex={-1}
      >
        <EmptyState
          description={t("images.emptyDescription")}
          icon="image"
          title={t("images.emptyTitle")}
        />
      </section>
    );
  }

  return (
    <Stack gap={8}>
      <ImageRows label={t("images.title")}>
        {query.pages.map(({ images }, pageIndex) => {
          const [first] = images;

          return first === undefined ? null : (
            <ImagePage
              imageHref={imageHref}
              images={images}
              key={first.id}
              onFirstLink={focusResult}
              pageIndex={pageIndex}
            />
          );
        })}
      </ImageRows>
      <More
        next={query.next}
        retryRef={(button) => {
          focusResult(query.pages.length, button);
        }}
        onLoad={() => {
          rememberFocus(query.pages.length);
        }}
      />
    </Stack>
  );
};
