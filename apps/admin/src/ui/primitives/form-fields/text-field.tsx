import type { ReactNode } from "react";
import { TextField as AriaTextField } from "react-aria-components";

import { fieldRoot } from "./field-control";
import { FieldDescription, FieldErrorMessage, FieldLabel } from "./field-parts";
import { TextInput } from "./text-input";

/** 1行の入力欄に渡す値。 */
export type TextFieldProps = {
  /** 入力欄の名前(フォームのキー)。 */
  readonly name: string;
  /** 入力欄のラベル。 */
  readonly label: string;
  /** 入力欄の補足。 */
  readonly description?: string | undefined;
  /** 入力欄の検証の伝え方。 */
  validationBehavior?: "aria" | "native";
  /** 入力が要るか。 */
  readonly isRequired?: boolean | undefined;
  /** 文字の数の上限。 */
  readonly maxLength?: number | undefined;
  /** ブラウザの自動入力の種類。 */
  readonly autoComplete?: string | undefined;
  /** 最初に入れておく値。 */
  readonly defaultValue?: string;
  /** 呼び出し元で管理する入力値。 */
  value?: string;
  /** 入力値が変わったときに呼ぶ関数。 */
  onChange?: (value: string) => void;
  /** 入力欄から focus が外れたときに呼ぶ関数。 */
  onBlur?: () => void;
  /** 呼び出し元から渡す誤りの知らせ。 */
  errorMessage?: string | undefined;
  /** 送る前に値を確かめ、誤りの知らせを返す関数(合っていれば undefined)。 */
  readonly validate?: (value: string) => string | undefined;
};

/** ラベルと補足と誤りの知らせを持つ、1行の入力欄。 */
export const TextField = ({
  name,
  label,
  description,
  validationBehavior,
  isRequired = false,
  maxLength,
  autoComplete,
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
      isRequired={isRequired}
      name={name}
      onBlur={() => {
        onBlur?.();
      }}
      onChange={(next) => {
        onChange?.(next);
      }}
      validate={(next) => validate?.(next)}
      // oxlint-disable-next-line project/styling-boundary -- React Aria の未指定の props を省く。見た目の props は含まない。
      {...fieldState}
    >
      <FieldLabel>{label}</FieldLabel>
      <TextInput autoComplete={autoComplete} maxLength={maxLength} />
      {description !== undefined && (
        <FieldDescription>{description}</FieldDescription>
      )}
      <FieldErrorMessage>{errorMessage}</FieldErrorMessage>
    </AriaTextField>
  );
};
