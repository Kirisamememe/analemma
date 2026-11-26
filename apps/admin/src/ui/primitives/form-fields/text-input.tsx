import type { ReactNode, Ref } from "react";
import { Input } from "react-aria-components";

import { fieldControl } from "./field-control";

import { typography } from "@/ui/typography";

type TextInputProps = {
  /** 入力欄の ID。 */
  id?: string;
  /** フォームのキー。 */
  name?: string;
  /** 入力欄のアクセシブルな名前。 */
  "aria-label"?: string;
  /** ブラウザの自動入力の種類。 */
  autoComplete?: string | undefined;
  /** 空欄のときに表示する入力例。 */
  placeholder?: string | undefined;
  /** 文字の数の上限。 */
  maxLength?: number | undefined;
  /** 最初に入れておく値。 */
  defaultValue?: string;
  /** 呼び出し元で管理する入力値。 */
  value?: string;
  /** 入力値が変わったときに呼ぶ関数。 */
  onChange?: (value: string) => void;
  /** 入力欄から focus が外れたときに呼ぶ関数。 */
  onBlur?: () => void;
  /** 入力欄の要素。 */
  ref?: Ref<HTMLInputElement> | undefined;
};

/** 1行のテキストを入力する部品。 */
export const TextInput = ({
  id,
  name,
  "aria-label": ariaLabel,
  autoComplete,
  maxLength,
  placeholder,
  defaultValue,
  value,
  onChange,
  onBlur,
  ref,
}: TextInputProps): ReactNode => (
  <Input
    aria-label={ariaLabel}
    autoComplete={autoComplete}
    className={fieldControl({
      className: [
        "h-control px-3 @max-3xs/nested-form:px-1",
        typography({ role: "body" }),
      ],
    })}
    defaultValue={defaultValue}
    id={id}
    maxLength={maxLength}
    placeholder={placeholder ?? ""}
    name={name}
    onBlur={onBlur}
    ref={ref}
    onChange={
      onChange === undefined
        ? undefined
        : (event) => {
            onChange(event.currentTarget.value);
          }
    }
    value={value}
  />
);
