import type { ReactNode, RefObject } from "react";

import { useImagePageFocus } from "./hooks/use-image-page-focus";
import { ConversionWatch } from "./list/conversion-watch";
import type { GalleryOptions } from "./list/gallery-options";
import { ImagePage } from "./list/image-page";
import { MoreImages } from "./list/more-images";

import { useAppContext } from "@/api/app-context";
import { useApiInfiniteQuery } from "@/api/server-state/use-api-infinite-query";
import { useTranslate } from "@/i18n/use-translate";
import {
  IMAGES_QUERY_KEY,
  IMAGE_PICKER_KEY,
  loadImagesPage,
} from "@/queries/images-query";
import { Stack } from "@/ui/layout";
import {
  EmptyState,
  ErrorState,
  ImageRows,
  ImageRowsPlaceholder,
} from "@/ui/patterns";

/** 画像の一覧に渡す値。 */
type ImagesSectionProps = GalleryOptions & {
  /** 選べる画像が無いときの focus の戻り先。 */
  fallbackFocus?: RefObject<HTMLButtonElement | null>;
};

/** 画像の一覧と、続きを読む操作。 */
export const ImagesSection = ({
  fallbackFocus,
  imageHref,
  singleChoice,
  renderChoice,
}: ImagesSectionProps): ReactNode => {
  const t = useTranslate();
  const { api } = useAppContext();

  const { rememberFocus, focusResult, focusList } =
    useImagePageFocus(fallbackFocus);

  const query = useApiInfiniteQuery({
    key: renderChoice === undefined ? IMAGES_QUERY_KEY : IMAGE_PICKER_KEY,
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

  if (
    query.refreshFailure === undefined &&
    query.next._tag === "None" &&
    !query.pages.some((page) => page.images.length > 0)
  ) {
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
      <ConversionWatch pages={query.pages} />
      <ImageRows
        label={t("images.title")}
        listRef={(list) => {
          focusList(list, {
            first: query.refreshFailure === undefined,
            lastPage:
              query.next._tag === "None" ||
              query.pages.at(-1)?.images.length === 0
                ? query.pages.length - 1
                : undefined,
          });
        }}
      >
        {query.pages.map(({ images }, pageIndex) => {
          const [first] = images;

          return first === undefined ? null : (
            <ImagePage
              imageHref={imageHref}
              renderChoice={renderChoice}
              singleChoice={singleChoice}
              images={images}
              key={pageIndex === 0 ? "first" : first.id} // 送った写真を先頭に足しても、最初のページを作り直さない
              onFirstLink={focusResult}
              pageIndex={pageIndex}
            />
          );
        })}
      </ImageRows>
      {query.refreshFailure !== undefined && (
        <ErrorState
          isRetrying={query.refreshFailure.isRetrying}
          layout="inline"
          level={2}
          onRetry={() => {
            rememberFocus(0);
            query.refreshFailure?.retry();
          }}
          title={t("images.refreshFailed")}
        />
      )}
      <MoreImages
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
