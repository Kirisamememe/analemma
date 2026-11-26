import { useCallback, useId, useMemo, useState } from "react";

import {
  availableImages,
  changeSelection,
  type ImageSelection,
  type SelectionOptions,
} from "../logic/image-selection";

import type { ImageSummary } from "@/queries/images-query";

/** 選べる枚数と確定時の受け取り方。 */
export type PickerSelection = SelectionOptions & {
  /** 選んだ画像を送っているか。 */
  isPending?: boolean;
} & (
    | {
        /** 1枚を選ぶ。 */
        mode: "single";
        /** 選んだ画像を受け取る。 */
        onConfirm: (image: ImageSummary) => void;
      }
    | {
        /** 複数の画像を選ぶ。 */
        mode: "multiple";
        /** 選んだ画像を受け取る。 */
        onConfirm: (images: readonly ImageSummary[]) => void;
      }
  );

const createSelectionStore = () => {
  let selected: ImageSelection = new Map();
  const listeners = new Set<() => void>();

  return {
    read: () => selected,
    subscribe: (notify: () => void) => {
      listeners.add(notify);

      return () => listeners.delete(notify);
    },
    update: (next: ImageSelection) => {
      selected = next;

      for (const notify of listeners) notify();
    },
  };
};

/** 入力欄とフッターがそれぞれの選択状態を購読するための hook。 */
export const useImageSelection = ({
  mode,
  onConfirm,
  included,
  missing,
  isPending = false,
}: PickerSelection) => {
  const [store] = useState(createSelectionStore);
  const group = useId();

  const options = useMemo(
    () => ({ mode, included, missing }),
    [mode, included, missing],
  );

  const change = useCallback(
    (image: ImageSummary, checked: boolean) => {
      store.update(
        changeSelection(store.read(), { ...options, image, checked }),
      );
    },
    [store, options],
  );

  const available = useCallback(
    () => availableImages(store.read(), options),
    [store, options],
  );

  const count = useCallback(() => available().length, [available]);

  const confirm = useCallback(() => {
    const images = available();

    if (mode === "multiple") onConfirm(images);
    else if (images[0] !== undefined) onConfirm(images[0]);
  }, [mode, onConfirm, available]);

  const source = useMemo(() => ({ store, group, mode }), [store, group, mode]);

  const conditions = useMemo(
    () => ({ included, missing, pending: isPending, change }),
    [included, missing, isPending, change],
  );

  return { source, conditions, count, confirm };
};
