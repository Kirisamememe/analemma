import type { ReactNode } from "react";
import { Input } from "react-aria-components";

import { fieldControl } from "./field-control";

import { typography } from "@/ui/typography";

type TextInputProps = {
  /** 入力欄の ID。 */
  readonly id?: string;
  /** フォームのキー。 */
  readonly name?: string;
  /** 入力欄のアクセシブルな名前。 */
  readonly "aria-label"?: string;
  /** ブラウザの自動入力の種類。 */
  readonly autoComplete?: string | undefined;
  /** 文字の数の上限。 */
  readonly maxLength?: number | undefined;
  /** 最初に入れておく値。 */
  readonly defaultValue?: string;
  /** 呼び出し元で管理する入力値。 */
  readonly value?: string;
  /** 入力値が変わったときに呼ぶ関数。 */
  readonly onChange?: (value: string) => void;
  /** 入力欄から focus が外れたときに呼ぶ関数。 */
  readonly onBlur?: () => void;
};

/** 1行のテキストを入力する部品。 */
export const TextInput = ({
  id,
  name,
  "aria-label": ariaLabel,
  autoComplete,
  maxLength,
  defaultValue,
  value,
  onChange,
  onBlur,
}: TextInputProps): ReactNode => (
  <Input
    aria-label={ariaLabel}
    autoComplete={autoComplete}
    className={fieldControl({
      className: ["h-control px-3", typography({ role: "body" })],
    })}
    defaultValue={defaultValue}
    id={id}
    maxLength={maxLength}
    name={name}
    onBlur={onBlur}
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
