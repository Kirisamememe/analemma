import { memo, type ReactNode, useCallback } from "react";

import { GalleryImage } from "./gallery-image";
import type { GalleryOptions } from "./gallery-options";

import type { ImageSummary } from "@/queries/images-query";

/** 1ページ分のタイルに渡す値。 */
type ImagePageProps = GalleryOptions & {
  /** 1ページ分の画像。 */
  images: readonly ImageSummary[];
  /** ページの番号。 */
  pageIndex: number;
  /** ページの最初のリンクを受け取る関数。 */
  onFirstLink: (pageIndex: number, link: HTMLElement | null) => void;
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

/** 1ページ分の画像のタイル。 */
export const ImagePage = memo(PageTiles);
