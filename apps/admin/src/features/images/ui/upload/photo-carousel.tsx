import type { ReactNode } from "react";

import { useCarouselSelection } from "./hooks/use-carousel-selection";
import { usePhotoPreview } from "./hooks/use-photo-preview";

import { Text } from "@/ui/layout";
import { Button } from "@/ui/primitives/button";
import { Icon } from "@/ui/primitives/graphics";
import { ScrollView } from "@/ui/primitives/navigation";
import { tv } from "@/ui/tv";
import { typography } from "@/ui/typography";

const style = tv({
  slots: {
    strip: "flex items-center gap-2 py-1",
    tile: ["group h-photo-preview flex-none rounded-xs", "outline-hidden"],
    image:
      "block h-full w-auto max-w-none rounded-xs group-focus-visible:focus-ring-inset",
    missing: [
      "flex aspect-photo h-full items-center justify-center gap-2",
      "rounded-xs bg-surface-muted px-2 group-focus-visible:focus-ring-inset",
    ],
    details: "flex items-center justify-between gap-3 px-panel",
    controls: "flex shrink-0 items-center rounded-full bg-surface-muted",
    count: [
      "min-w-10 text-center tabular-nums trim-cap-height",
      typography({ role: "label" }),
    ],
  },
  variants: { selected: { true: { tile: "focus-ring-current" } } },
});

/** カルーセルに並べる写真。 */
type CarouselPhoto = {
  /** 写真を見分ける番号。 */
  id: number;
  /** 写真を選ぶボタンの名前。 */
  name: string;
  /** 写真のファイルか配信用の URL。 */
  source: File | string;
  /** 元のファイルを表示できないときに使う配信用の URL。 */
  previewUrl?: string | undefined;
};

type PreviewProps = {
  /** 表示する写真。 */
  photo: CarouselPhoto;
  /** プレビューの代わりに出す文言。 */
  missing: string;
};

const Preview = ({ photo, missing }: PreviewProps): ReactNode => {
  const preview = usePhotoPreview(photo.source, photo.previewUrl);

  if (preview) {
    const { attach, key, onError, src } = preview;
    return (
      <img
        alt=""
        className={style().image()}
        key={key}
        onError={onError}
        ref={attach}
        src={src}
      />
    );
  }

  return (
    <span className={style().missing()}>
      <Icon name="image-off" />
      <Text as="span" variant="caption">
        {missing}
      </Text>
    </span>
  );
};

/** 写真と選択を受け取るカルーセル。 */
type PhotoCarouselProps = {
  /** 選択中のファイル名に添える状態や操作。 */
  children?: ReactNode;
  /** 並べる写真。 */
  photos: readonly CarouselPhoto[];
  /** 選択中の写真の番号。 */
  selectedId: number;
  /** 写真を選んだときに呼ぶ関数。 */
  onSelect: (id: number) => void;
  /** 写真の列のアクセシブルな名前。 */
  label: string;
  /** 前の写真を選ぶボタンの名前。 */
  previous: string;
  /** 次の写真を選ぶボタンの名前。 */
  next: string;
  /** 写真を表示できないときの文言。 */
  missing: string;
  /** 選択中の位置と枚数を表す文言。 */
  position: (current: number, total: number) => string;
};

/** 元の縦横比で並んだ写真から1枚を選ぶカルーセル。 */
export const PhotoCarousel = ({
  children,
  photos,
  selectedId,
  onSelect,
  label,
  previous,
  next,
  missing,
  position,
}: PhotoCarouselProps): ReactNode => {
  const selection = useCarouselSelection(photos, { selectedId, onSelect });

  const {
    index,
    selectedPhoto,
    attachRail,
    attachSelected,
    move,
    revealSelected,
    previous: selectPrevious,
    next: selectNext,
  } = selection;

  if (!selectedPhoto) return null;

  return (
    <figure>
      <ScrollView
        inset="dialog"
        label={label}
        orientation="horizontal"
        viewportRef={attachRail}
      >
        <fieldset aria-label={label} className={style().strip()}>
          {photos.map((photo, photoIndex) => (
            <button
              aria-label={photo.name}
              aria-pressed={photo.id === selectedId}
              className={style({ selected: photo.id === selectedId }).tile()}
              key={photo.id}
              onClick={() => {
                onSelect(photo.id);
              }}
              onKeyDown={move}
              onLoadCapture={photoIndex <= index ? revealSelected : undefined}
              ref={photo.id === selectedId ? attachSelected : undefined}
              tabIndex={photo.id === selectedId ? 0 : -1}
              type="button"
            >
              <Preview missing={missing} photo={photo} />
            </button>
          ))}
        </fieldset>
      </ScrollView>
      <figcaption className={style().details()}>
        <div className="min-w-0">
          {children ?? <Text variant="label">{selectedPhoto.name}</Text>}
        </div>
        <div className={style().controls()}>
          <Button
            aria-label={previous}
            size="sm"
            tone="quiet"
            rounded="full"
            icon="chevron-left"
            isDisabled={index === 0}
            onPress={selectPrevious}
          />
          <span className={style().count()}>
            {position(index + 1, photos.length)}
          </span>
          <Button
            aria-label={next}
            size="sm"
            tone="quiet"
            rounded="full"
            icon="chevron-right"
            isDisabled={index === photos.length - 1}
            onPress={selectNext}
          />
        </div>
      </figcaption>
    </figure>
  );
};
