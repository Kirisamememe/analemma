import type { ReactNode } from "react";

import { Icon } from "@/ui/primitives/graphics";

type ImageThumbnailProps = {
  /** 表示する写真の URL。 */
  src: string | undefined;
  /** 写真の alt。 */
  alt: string | null | undefined;
};

/** 一覧で写真を見分けるための小さな画像。 */
export const ImageThumbnail = ({
  src,
  alt,
}: ImageThumbnailProps): ReactNode => {
  return src === undefined ? (
    <Icon name="image-off" />
  ) : (
    <img
      alt={alt ?? ""}
      className="size-16 shrink-0 rounded-control object-cover"
      loading="lazy"
      src={src}
    />
  );
};
