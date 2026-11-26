import { type KeyboardEvent, useCallback, useRef } from "react";

const reveal = (rail: HTMLElement | null, button: HTMLElement | null): void => {
  if (!button || !rail) return;

  const tile = button.getBoundingClientRect();
  const viewport = rail.getBoundingClientRect();

  const inset = Number(
    getComputedStyle(rail).scrollPaddingInlineStart.replace("px", ""),
  );

  const left = tile.left - viewport.left - inset;
  const right = tile.right - viewport.right + inset;

  if (left < 0 && right < 0) rail.scrollBy({ left: Math.max(left, right) });
  else if (right > 0 && left > 0) {
    rail.scrollBy({ left: Math.min(right, left) });
  }
};

type SelectionOptions = {
  /** 選択中の写真の番号。 */
  selectedId: number;
  /** 写真を選ぶ関数。 */
  onSelect: (id: number) => void;
};

/** カルーセルの選択と focus、写真の列のスクロール。 */
export const useCarouselSelection = <T extends Record<"id", number>>(
  photos: readonly T[],
  { selectedId, onSelect }: SelectionOptions,
) => {
  const rail = useRef<HTMLElement | null>(null);
  const selected = useRef<HTMLButtonElement | null>(null);
  const focusId = useRef<number | undefined>(undefined);
  const index = photos.findIndex(({ id }) => id === selectedId);

  const attachRail = useCallback((element: HTMLElement | null) => {
    rail.current = element;
    reveal(element, selected.current);
  }, []);

  const attachSelected = useCallback(
    (button: HTMLButtonElement | null) => {
      selected.current = button;

      if (button && focusId.current === selectedId) {
        button.focus({ preventScroll: true });
        focusId.current = undefined;
      }

      reveal(rail.current, button);
    },
    [selectedId],
  );

  const selectAt = (target: number): void => {
    const photo = photos[target];

    if (!photo || photo.id === selectedId) return;

    focusId.current = photo.id;
    onSelect(photo.id);
  };

  const move = (event: Pick<KeyboardEvent, "key" | "preventDefault">): void => {
    const targets: Partial<Record<string, number>> = {
      ArrowLeft: index - 1,
      ArrowRight: index + 1,
      Home: 0,
      End: photos.length - 1,
    };

    const target = targets[event.key];

    if (target === undefined) return;

    event.preventDefault();
    selectAt(target);
  };

  return {
    selectedPhoto: photos[index],
    index,
    attachRail,
    attachSelected,
    move,
    previous: () => {
      selectAt(index - 1);
    },
    next: () => {
      selectAt(index + 1);
    },
    revealSelected: () => {
      reveal(rail.current, selected.current);
    },
  };
};
