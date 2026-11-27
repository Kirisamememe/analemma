import { memo, type ReactNode, type RefObject, useCallback } from "react";

import { useConversionWatch } from "./hooks/use-conversion-watch";
import { useImagePageFocus } from "./hooks/use-image-page-focus";
import { isConverted } from "./logic/conversion-results";
import { toImageStatusView } from "./logic/image-status";

import { useAppContext } from "@/api/app-context";
import {
  type NextPage,
  useApiInfiniteQuery,
} from "@/api/server-state/use-api-infinite-query";
import { formatLocalDate } from "@/i18n/format-date-time";
import { useLocale, useTranslate } from "@/i18n/use-translate";
import {
  type ImageSummary,
  IMAGES_QUERY_KEY,
  IMAGE_PICKER_KEY,
  loadImagesPage,
} from "@/queries/images-query";
import { Stack } from "@/ui/layout";
import {
  Announcement,
  EmptyState,
  ErrorState,
  ImageRows,
  ImageRowsPlaceholder,
  ImageTile,
} from "@/ui/patterns";
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
        retryRef={next.isRetrying ? undefined : retryRef}
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
  /** 1枚の選択用に写真全体を見せるか。 */
  singleChoice?: boolean | undefined;
  /** 選べる画像が無いときの focus の戻り先。 */
  fallbackFocus?: RefObject<HTMLButtonElement | null>;
  /** 画像を見る画面への行き先を返す関数。 */
  imageHref?: ((id: string) => AppHref) | undefined;
  /** 写真を選ぶときの入力欄。 */
  renderChoice?:
    | ((
        image: ImageSummary,
        focus: (element: HTMLElement | null) => void,
      ) => ReactNode)
    | undefined;
};

type ImagePageProps = ImagesSectionProps & {
  /** 1ページ分の画像。 */
  images: readonly ImageSummary[];
  /** ページの番号。 */
  pageIndex: number;
  /** ページの最初のリンクを受け取る関数。 */
  onFirstLink: (pageIndex: number, link: HTMLElement | null) => void;
};

type GalleryImageProps = Pick<
  ImagesSectionProps,
  "imageHref" | "renderChoice" | "singleChoice"
> & {
  /** 表示する画像。 */
  image: ImageSummary;
  /** ページの最初の画像か。 */
  first: boolean;
  /** ページを読み込んだ後の focus の移動先。 */
  focusFirst: (element: HTMLElement | null) => void;
};

const GalleryImageContent = ({
  image,
  first,
  focusFirst,
  imageHref,
  singleChoice,
  renderChoice,
}: GalleryImageProps): ReactNode => {
  const t = useTranslate();
  const locale = useLocale();
  const status = toImageStatusView(image.status);

  return (
    <ImageTile
      singleChoice={singleChoice}
      alt={image.alt}
      badge={status.badge === undefined ? undefined : t(status.badge)}
      badgeTone={status.tone}
      isPending={status.isPending}
      date={
        image.takenAt === null
          ? undefined
          : formatLocalDate(locale, image.takenAt)
      }
      href={imageHref?.(image.id)}
      choice={renderChoice?.(image, focusFirst)}
      images={image.deliveryImages}
      linkRef={first ? focusFirst : undefined}
      missing={t(status.missing)}
      title={image.title}
      untitled={t("images.untitled")}
    />
  );
};

const GalleryImage = memo(GalleryImageContent);

type ConversionWatchProps = {
  /** 読み込んだ画像のページ。 */
  pages: Parameters<typeof useConversionWatch>[0];
};

const ConversionWatch = ({ pages }: ConversionWatchProps): ReactNode => {
  const t = useTranslate();
  const { isWatching, settled } = useConversionWatch(pages);

  if (!isWatching && settled.length === 0) return null;

  return (
    <Announcement>
      {settled
        .map((image) =>
          t(
            isConverted(image)
              ? "images.announceConverted"
              : "images.announceUnconverted",
            { title: image.title ?? t("images.untitled") },
          ),
        )
        .join(" ")}
    </Announcement>
  );
};

const PageTiles = ({
  images,
  imageHref,
  singleChoice,
  renderChoice,
  pageIndex,
  onFirstLink,
}: ImagePageProps): ReactNode => {
  const focusFirst = useCallback(
    (element: HTMLElement | null) => {
      if (element !== null && !element.matches(":disabled")) {
        onFirstLink(pageIndex, element);
      }
    },
    [onFirstLink, pageIndex],
  );

  return images.map((image, index) => (
    <GalleryImage
      key={image.id}
      image={image}
      first={index === 0}
      focusFirst={focusFirst}
      imageHref={imageHref}
      renderChoice={renderChoice}
      singleChoice={singleChoice}
    />
  ));
};

const ImagePage = memo(PageTiles);

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
