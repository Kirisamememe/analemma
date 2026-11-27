import type { ReactNode } from "react";

import { carouselStyle } from "./carousel-styles";
import { useCarouselSelection } from "./hooks/use-carousel-selection";
import { PhotoPreview } from "./photo-preview";

import { Text } from "@/ui/layout";
import { Button } from "@/ui/primitives/button";
import { ScrollView, SnapItem } from "@/ui/primitives/navigation";

/** カルーセルに並べる写真。 */
type CarouselPhoto = {
  /** 写真を見分ける番号。 */
  id: number;
  /** 写真を選ぶボタンの名前。 */
  name: string;
  /** 写真のファイルか配信用の URL。 */
  source: File | string;
  /** 写真の上に重ねる内容。 */
  overlay?: ReactNode;
  /** 元のファイルを表示できないときに使う配信用の URL。 */
  previewUrl?: string | undefined;
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
    attachFrame,
    attachSelected,
    move,
    previous: selectPrevious,
    next: selectNext,
  } = selection;

  if (!selectedPhoto) return null;

  return (
    <figure>
      <ScrollView
        inset="modal"
        snap={photos.length > 1}
        label={label}
        orientation="horizontal"
        viewportRef={attachRail}
      >
        <fieldset aria-label={label} className={carouselStyle().strip()}>
          {photos.map((photo) => (
            <SnapItem key={photo.id} ref={attachFrame(photo.id)}>
              <button
                aria-label={photo.name}
                aria-pressed={photo.id === selectedId}
                className={carouselStyle({
                  selected: photo.id === selectedId,
                }).tile()}
                onClick={() => {
                  onSelect(photo.id);
                }}
                onKeyDown={move}
                ref={photo.id === selectedId ? attachSelected : undefined}
                tabIndex={photo.id === selectedId ? 0 : -1}
                type="button"
              >
                <PhotoPreview
                  missing={missing}
                  source={photo.source}
                  previewUrl={photo.previewUrl}
                />
              </button>
              {photo.overlay}
            </SnapItem>
          ))}
        </fieldset>
      </ScrollView>
      <figcaption className={carouselStyle().details()}>
        <div className="min-w-0">
          {children ?? <Text variant="label">{selectedPhoto.name}</Text>}
        </div>
        <div className={carouselStyle().controls()}>
          <Button
            aria-label={previous}
            size="sm"
            tone="quiet"
            rounded="full"
            icon="chevron-left"
            isDisabled={index === 0}
            onPress={selectPrevious}
          />
          <span className={carouselStyle().count()}>
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
