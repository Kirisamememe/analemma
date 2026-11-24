import { useCallback, useRef, useState } from "react";

import type { ContentIssue } from "@analemma/contract";

import {
  changeImageField,
  type ImageFieldAction,
} from "../logic/image-field-change";

/** 画像の項目とフォームを結ぶ値。 */
export type ImageFieldInput = {
  /** フォームが保持する画像の ID。 */
  value: string | null;
  /** 画像の変更をフォームに渡す。 */
  onChange: (value: string | null) => void;
  /** 最後に送った値について server が返した知らせ。 */
  issue?: Pick<ContentIssue, "message"> | undefined;
};

/** 画像の項目の操作をフォームの更新と focus につなぐ。 */
export const useImageField = ({ value, onChange, issue }: ImageFieldInput) => {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);

  const [dismissed, setDismissed] = useState<typeof issue>();

  const retryRef = useCallback((button: HTMLButtonElement | null) => {
    if (button === null) return;

    return () => {
      if (document.activeElement === button) trigger.current?.focus();
    };
  }, []);

  const apply = (action: ImageFieldAction) => {
    const next = changeImageField(value, action);

    if (next.value !== value) {
      setDismissed(issue);
      onChange(next.value);
    }

    setOpen(next.open);

    if (action === "remove") trigger.current?.focus();
  };

  const press = (action: "choose" | "cancel" | "remove") => () => {
    apply(action);
  };

  return {
    open,
    trigger,
    retryRef,
    error: issue === dismissed ? undefined : issue?.message,
    choose: press("choose"),
    close: press("cancel"),
    confirm: apply,
    remove: press("remove"),
  };
};
