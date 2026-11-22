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
export type TextAreaProps = {
  /** 入力欄の名前(フォームのキー)。 */
  readonly name: string;
  /** 入力欄のラベル。 */
  readonly label: string;
  /** 入力欄の補足。 */
  readonly description?: string | undefined;
  /** 最初に入れておく値。 */
  readonly defaultValue?: string;
  /** 文字の数の上限。 */
  readonly maxLength?: number | undefined;
  /** 入力が要るか。 */
  readonly isRequired?: boolean | undefined;
  /** 入力欄が無効か。 */
  readonly isDisabled?: boolean | undefined;
  /** 読み取り専用か。 */
  readonly isReadOnly?: boolean | undefined;
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
      // oxlint-disable-next-line project/styling-boundary -- React Aria の未指定の props を省く。見た目の props は含まない。
      {...fieldState}
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
      <FieldErrorMessage>{errorMessage}</FieldErrorMessage>
    </AriaTextField>
  );
};
