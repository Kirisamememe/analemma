import type { ReactNode } from "react";
import {
  TextArea as AriaTextArea,
  TextField as AriaTextField,
} from "react-aria-components";

import {
  fieldControl,
  fieldRoot,
} from "@/ui/primitives/form-fields/field-control";
import { FieldDescription } from "@/ui/primitives/form-fields/parts/field-description";
import { FieldErrorMessage } from "@/ui/primitives/form-fields/parts/field-error-message";
import { FieldLabel } from "@/ui/primitives/form-fields/parts/field-label";
import { typography } from "@/ui/typography";

/** 長いテキストの入力欄に渡す値。 */
export type TextAreaProps = {
  /** 入力欄の名前(フォームのキー)。 */
  name: string;
  /** 入力欄のラベル。 */
  label: string;
  /** 入力欄の補足。 */
  description?: string | undefined;
  /** 最初に入れておく値。 */
  defaultValue?: string;
  /** 空欄のときに表示する入力例。 */
  placeholder?: string | undefined;
  /** 文字の数の上限。 */
  maxLength?: number | undefined;
  /** 入力が要るか。 */
  isRequired?: boolean | undefined;
  /** 入力欄が無効か。 */
  isDisabled?: boolean | undefined;
  /** 読み取り専用か。 */
  isReadOnly?: boolean | undefined;
  /** 入力欄の検証の伝え方。 */
  validationBehavior?: "aria" | "native";
  /** 呼び出し元で管理する入力値。 */
  value?: string;
  /** 入力値が変わったときに呼ぶ関数。 */
  onChange?: (value: string) => void;
  /** 入力欄から focus が外れたときに呼ぶ関数。 */
  onBlur?: () => void;
  /** 呼び出し元から渡す誤りの知らせ。 */
  errorMessage?: string | undefined;
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
  placeholder,
  isRequired = false,
  isDisabled = false,
  isReadOnly = false,
  validationBehavior,
  value,
  onChange,
  onBlur,
  errorMessage,
  validate,
}: TextAreaProps): ReactNode => {
  const fieldState = {
    ...(errorMessage === undefined ? {} : { isInvalid: true }),
    ...(validationBehavior === undefined ? {} : { validationBehavior }),
    ...(value === undefined ? {} : { value }),
  };

  return (
    <AriaTextField
      className={fieldRoot()}
      defaultValue={defaultValue}
      isDisabled={isDisabled}
      isReadOnly={isReadOnly}
      isRequired={isRequired}
      name={name}
      onBlur={() => {
        onBlur?.();
      }}
      onChange={(next) => {
        onChange?.(next);
      }}
      validate={(next) => validate?.(next)}
      {...fieldState}
    >
      <FieldLabel isRequired={isRequired}>{label}</FieldLabel>
      <AriaTextArea
        className={fieldControl({
          className: [
            "resize-y px-3 @max-3xs/nested-form:px-1 py-2",
            typography({ role: "body-long" }),
          ],
        })}
        maxLength={maxLength}
        placeholder={placeholder}
        rows={4}
      />
      {description !== undefined && (
        <FieldDescription>{description}</FieldDescription>
      )}
      <FieldErrorMessage>{errorMessage}</FieldErrorMessage>
    </AriaTextField>
  );
};
