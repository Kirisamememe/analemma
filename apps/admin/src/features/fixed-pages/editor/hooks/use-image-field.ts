import { useRef, useState } from "react";

import {
  changeImageField,
  type ImageFieldAction,
} from "../logic/image-field-change";

import type { ImageSummary } from "@/queries/images-query";

/** 画像の項目の操作をフォームの更新と focus につなぐ。 */
export const useImageField = (
  value: string | null,
  onChange: (value: string | null) => void,
) => {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);

  const apply = (action: ImageFieldAction) => {
    const next = changeImageField(value, action);

    if (next.value !== value) onChange(next.value);

    setOpen(next.open);

    if (action.type === "remove") trigger.current?.focus();
  };

  return {
    open,
    trigger,
    choose: () => {
      apply({ type: "choose" });
    },
    close: () => {
      apply({ type: "cancel" });
    },
    confirm: ({ id }: Pick<ImageSummary, "id">) => {
      apply({ type: "confirm", id });
    },
    remove: () => {
      apply({ type: "remove" });
    },
  };
};
