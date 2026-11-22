import type { ReactNode } from "react";
import {
  TextArea as AriaTextArea,
  TextField as AriaTextField,
} from "react-aria-components";

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

/** 長いテキストの入力欄に渡す値。 */
type TextAreaProps = {
  /** 入力欄の名前(フォームのキー)。 */
  name: string;
  /** 入力欄のラベル。 */
  label: string;
  /** 入力欄の補足。 */
  description?: string;
  /** 最初に入れておく値。 */
  defaultValue?: string;
  /** 文字の数の上限。 */
  maxLength?: number;
  /** 入力が要るか。 */
  isRequired?: boolean;
  /** 入力欄が無効か。 */
  isDisabled?: boolean;
  /** 読み取り専用か。 */
  isReadOnly?: boolean;
  /** 送る前に値を確かめ、誤りの知らせを返す関数(合っていれば undefined)。 */
  validate?: (value: string) => string | undefined;
};

/** 長いテキストの入力欄。 */
export const TextArea = ({
  name,
  label,
  description,
  defaultValue = "",
  maxLength,
  isRequired = false,
  isDisabled = false,
  isReadOnly = false,
  validate,
}: TextAreaProps): ReactNode => (
  <AriaTextField
    className={fieldRoot()}
    defaultValue={defaultValue}
    isDisabled={isDisabled}
    isReadOnly={isReadOnly}
    isRequired={isRequired}
    name={name}
    validate={(value) => validate?.(value)}
  >
    <FieldLabel>{label}</FieldLabel>
    <AriaTextArea
      className={fieldControl({
        className: ["resize-y px-3 py-2", typography({ role: "body-long" })],
      })}
      maxLength={maxLength}
      rows={4}
    />
    {description !== undefined && (
      <FieldDescription>{description}</FieldDescription>
    )}
    <FieldErrorMessage />
  </AriaTextField>
);
