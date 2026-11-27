import { memo, type ReactNode } from "react";

import { carouselStyle } from "./carousel-styles";
import { usePhotoPreview } from "./hooks/use-photo-preview";

import { Text } from "@/ui/layout";
import { Icon } from "@/ui/primitives/graphics";

/** 写真のプレビューに渡す値。 */
type PhotoPreviewProps = {
  /** 写真のファイルか配信用の URL。 */
  source: File | string;
  /** 元のファイルを表示できないときに使う配信用の URL。 */
  previewUrl?: string | undefined;
  /** プレビューの代わりに出す文言。 */
  missing: string;
};

const PreviewContent = ({
  source,
  previewUrl,
  missing,
}: PhotoPreviewProps): ReactNode => {
  const preview = usePhotoPreview(source, previewUrl);

  if (preview) {
    const { attach, key, onError, src } = preview;
    return (
      <img
        alt=""
        className={carouselStyle().image()}
        key={key}
        onError={onError}
        ref={attach}
        src={src}
      />
    );
  }

  return (
    <span className={carouselStyle().missing()}>
      <Icon name="image-off" />
      <Text as="span" variant="caption">
        {missing}
      </Text>
    </span>
  );
};

/** カルーセルに並べる写真の、プレビューか、表示できないときの文言。 */
export const PhotoPreview = memo(PreviewContent);
