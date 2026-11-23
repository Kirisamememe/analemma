import { useState } from "react";

import type { DateInputProps } from "../date-input";

type DateDraftOptions = Pick<DateInputProps, "value" | "onBlur" | "onChange">;

type DateDraft = {
  /** 日付が未完か。 */
  incomplete: boolean;
  /** 日付の入力欄から出たときの処理。 */
  onBlur: (incomplete: boolean) => void;
  /** 日付が変わったときの処理。 */
  onChange: (value: string | null) => void;
};

/** 日付の入力欄で blur 後に表示する検証状態。 */
export const useDateDraft = ({
  value,
  onBlur,
  onChange,
}: DateDraftOptions): DateDraft => {
  const [draft, setDraft] = useState({ value, incomplete: false });

  if (draft.value !== value) {
    setDraft({ value, incomplete: false });
  }

  return {
    incomplete: draft.value === value && draft.incomplete,
    onBlur: (incomplete) => {
      setDraft({ value, incomplete });
      onBlur?.();
    },
    onChange: (next) => {
      setDraft({ value, incomplete: false });
      onChange?.(next);
    },
  };
};
