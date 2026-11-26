import {
  type ChangeEvent,
  use,
  useCallback,
  useSyncExternalStore,
} from "react";

import {
  ChoiceConditionsContext,
  SelectionSourceContext,
} from "../image-choice-context";

import type { ImageSummary } from "@/queries/images-query";

/** 1枚の画像の選択状態を購読し、入力欄の操作につなぐ。 */
export const useImageChoice = (image: ImageSummary) => {
  const source = use(SelectionSourceContext);
  const conditions = use(ChoiceConditionsContext);

  if (source === null || conditions === null) {
    throw new Error("ImageChoice requires an ImagePicker");
  }

  const { read, subscribe, group, mode } = source;
  const { pending, change } = conditions;
  const included = conditions.included?.has(image.id) === true;
  const missing = conditions.missing?.has(image.id) === true;

  const selected = useSyncExternalStore(subscribe, () => read().has(image.id));

  const onChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      change(image, event.target.checked);
    },
    [change, image],
  );

  return {
    checked: selected && !included && !missing,
    disabled: included || missing || pending,
    group,
    type: mode === "single" ? "radio" : "checkbox",
    missing,
    included,
    onChange,
  };
};
