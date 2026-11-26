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
        /** 開いたときに選択されている画像。 */
        initialImage?: ImageSummary | undefined;
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
  let selected: ImageSelection | undefined;
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
export const useImageSelection = (picker: PickerSelection) => {
  const { mode, onConfirm, included, missing, isPending = false } = picker;

  const [store] = useState(createSelectionStore);
  const group = useId();
  const initial = picker.mode === "single" ? picker.initialImage : undefined;

  const read = useMemo(() => {
    const fallback: ImageSelection = new Map(
      initial ? [[initial.id, initial]] : [],
    );

    return () => store.read() ?? fallback;
  }, [initial, store]);

  const options = useMemo(
    () => ({ mode, included, missing }),
    [mode, included, missing],
  );

  const change = useCallback(
    (image: ImageSummary, checked: boolean) => {
      store.update(changeSelection(read(), { ...options, image, checked }));
    },
    [store, read, options],
  );

  const available = useCallback(
    () => availableImages(read(), options),
    [read, options],
  );

  const count = useCallback(() => available().length, [available]);

  const summary = useCallback(() => {
    const images = available();
    return mode === "multiple" ? images.length : images[0];
  }, [available, mode]);

  const confirm = useCallback(() => {
    const images = available();

    if (mode === "multiple") onConfirm(images);
    else if (images[0] !== undefined) onConfirm(images[0]);
  }, [mode, onConfirm, available]);

  const source = useMemo(
    () => ({ read, subscribe: store.subscribe, group, mode }),
    [read, store, group, mode],
  );

  const conditions = useMemo(
    () => ({ included, missing, pending: isPending, change }),
    [included, missing, isPending, change],
  );

  return { source, conditions, count, summary, confirm };
};
