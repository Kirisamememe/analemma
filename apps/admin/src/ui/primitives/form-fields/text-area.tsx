import type { ReactNode } from "react";
import {
  TextArea as AriaTextArea,
  TextField as AriaTextField,
} from "react-aria-components";

import { typography } from "../../typography";
import { fieldControl, fieldRoot } from "./field-control";
import { FieldDescription, FieldErrorMessage, FieldLabel } from "./field-parts";

/** 長いテキストの入力欄に渡す値。 */
type TextAreaProps = {
  /** 入力欄の名前(フォームのキー)。 */
  readonly name: string;
  /** 入力欄のラベル。 */
  readonly label: string;
  /** 入力欄の補足。 */
  readonly description?: string;
  /** 最初に入れておく値。 */
  readonly defaultValue?: string;
  /** 文字の数の上限。 */
  readonly maxLength?: number;
  /** 入力が要るか。 */
  readonly isRequired?: boolean;
  /** 入力欄が無効か。 */
  readonly isDisabled?: boolean;
  /** 読み取り専用か。 */
  readonly isReadOnly?: boolean;
  /** 送る前に値を確かめ、誤りの知らせを返す関数(合っていれば undefined)。 */
  readonly validate?: (value: string) => string | undefined;
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
