import type { ReactNode, Ref } from "react";
import { TextField as AriaTextField } from "react-aria-components";

import { fieldRoot } from "./field-control";
import { FieldDescription } from "./parts/field-description";
import { FieldErrorMessage } from "./parts/field-error-message";
import { FieldLabel } from "./parts/field-label";
import { TextInput } from "./text-input";

/** 1行の入力欄に渡す値。 */
export type TextFieldProps = {
  /** 入力欄の名前(フォームのキー)。 */
  name: string;
  /** 入力欄のラベル。 */
  label: string;
  /** 入力欄の補足。 */
  description?: string | undefined;
  /** 入力欄の検証の伝え方。 */
  validationBehavior?: "aria" | "native";
  /** 入力が要ることを示す文言。 */
  requiredLabel?: string | undefined;
  /** 読み取り専用か。 */
  isReadOnly?: boolean | undefined;
  /** 空欄のときに表示する入力例。 */
  placeholder?: string | undefined;
  /** 文字の数の上限。 */
  maxLength?: number | undefined;
  /** ブラウザの自動入力の種類。 */
  autoComplete?: string | undefined;
  /** 入力欄の要素(focus を移すときに使う)。 */
  inputRef?: Ref<HTMLInputElement> | undefined;
  /** 最初に入れておく値。 */
  defaultValue?: string;
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

/** ラベルと補足と誤りの知らせを持つ、1行の入力欄。 */
export const TextField = ({
  name,
  label,
  description,
  validationBehavior,
  requiredLabel,
  isReadOnly = false,
  maxLength,
  placeholder,
  autoComplete,
  inputRef,
  defaultValue = "",
  value,
  onChange,
  onBlur,
  errorMessage,
  validate,
}: TextFieldProps): ReactNode => {
  const fieldState = {
    ...(errorMessage === undefined ? {} : { isInvalid: true }),
    ...(validationBehavior === undefined ? {} : { validationBehavior }),
    ...(value === undefined ? {} : { value }),
  };

  return (
    <AriaTextField
      className={fieldRoot()}
      defaultValue={defaultValue}
      isReadOnly={isReadOnly}
      isRequired={requiredLabel !== undefined}
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
      <FieldLabel requiredLabel={requiredLabel}>{label}</FieldLabel>
      <TextInput
        autoComplete={autoComplete}
        maxLength={maxLength}
        placeholder={placeholder}
        ref={inputRef}
      />
      {description !== undefined && (
        <FieldDescription>{description}</FieldDescription>
      )}
      <FieldErrorMessage>{errorMessage}</FieldErrorMessage>
    </AriaTextField>
  );
};
