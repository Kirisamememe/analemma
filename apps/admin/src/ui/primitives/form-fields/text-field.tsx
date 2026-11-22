import type { ReactNode } from "react";
import { TextField as AriaTextField, Input } from "react-aria-components";

import {
  fieldControl,
  fieldRoot,
} from "@/ui/primitives/form-fields/field-control";
import {
  FieldDescription,
  FieldErrorMessage,
  FieldLabel,
} from "@/ui/primitives/form-fields/field-parts";
import { typography } from "@/ui/typography";

/** 1行の入力欄に渡す値。 */
type TextFieldProps = {
  /** 入力欄の名前(フォームのキー)。 */
  readonly name: string;
  /** 入力欄のラベル。 */
  readonly label: string;
  /** 入力欄の補足。 */
  readonly description?: string | undefined;
  /** 入力が要るか。 */
  readonly isRequired?: boolean;
  /** 文字の数の上限。 */
  readonly maxLength?: number | undefined;
  /** ブラウザの自動入力の種類。 */
  readonly autoComplete?: string;
  /** 最初に入れておく値。 */
  readonly defaultValue?: string;
  /** 送る前に値を確かめ、誤りの知らせを返す関数(合っていれば undefined)。 */
  readonly validate?: (value: string) => string | undefined;
};

/** ラベルと補足と誤りの知らせを持つ、1行の入力欄。 */
export const TextField = ({
  name,
  label: title,
  description: help,
  isRequired = false,
  maxLength,
  autoComplete,
  defaultValue = "",
  validate,
}: TextFieldProps): ReactNode => (
  <AriaTextField
    className={fieldRoot()}
    defaultValue={defaultValue}
    validate={(value) => validate?.(value)}
    isRequired={isRequired}
    name={name}
  >
    <FieldLabel>{title}</FieldLabel>
    <Input
      autoComplete={autoComplete}
      className={fieldControl({
        className: ["h-control px-3", typography({ role: "body" })],
      })}
      maxLength={maxLength}
    />
    {help !== undefined && <FieldDescription>{help}</FieldDescription>}
    <FieldErrorMessage />
  </AriaTextField>
);
