import { type ReactNode, useState } from "react";

import { useAppContext } from "@/api/app-context";
import {
  type NextPage,
  useApiInfiniteQuery,
} from "@/api/server-state/use-api-infinite-query";
import {
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
};

const More = ({ next, onLoad }: MoreProps): ReactNode => {
  const t = useTranslate();

  if (next._tag === "None") return null;

  if (next._tag === "Failed") {
    return (
      <ErrorState
        isRetrying={next.isRetrying}
        layout="inline"
        level={2}
        onRetry={next.retry}
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
  /** 画像を見る画面を返す関数。 */
  imageHref: (id: string) => AppHref;
};

/** 画像の一覧(新しく足した順)と、続きを読む操作。 */
export const ImagesSection = ({ imageHref }: ImagesSectionProps): ReactNode => {
  const t = useTranslate();
  const locale = useLocale();
  const { api } = useAppContext();
  const [focusAt, setFocusAt] = useState<number>(); // 続きを読んだら、足した最初の写真に focus を移す

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
        onRetry={query.retry}
        title={t("images.loadFailed")}
      />
    );
  }

  const images = query.pages.flatMap((page) => page.images);

  if (images.length === 0) {
    return (
      <EmptyState
        description={t("images.emptyDescription")}
        icon="image"
        title={t("images.emptyTitle")}
      />
    );
  }

  const focusOnce = (link: HTMLAnchorElement | null): void => {
    if (link === null) return;

    link.focus();
    setFocusAt(undefined);
  };

  return (
    <Stack gap={8}>
      <ImageRows label={t("images.title")}>
        {images.map((image, index) => (
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
            linkRef={index === focusAt ? focusOnce : undefined}
            missing={t("images.noDeliveryImage")}
            title={image.title}
            untitled={t("images.untitled")}
          />
        ))}
      </ImageRows>
      <More
        next={query.next}
        onLoad={() => {
          setFocusAt(images.length);
        }}
      />
    </Stack>
  );
};
