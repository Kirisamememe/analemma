import type { ReactNode } from "react";
import {
  Button,
  Group,
  Input,
  NumberField as AriaNumberField,
} from "react-aria-components";
import { useTranslation } from "react-i18next";

import { typography } from "../../typography";
import { fieldControl, fieldRoot } from "./field-control";
import { FieldDescription, FieldErrorMessage, FieldLabel } from "./field-parts";

const FORMAT_OPTIONS: Intl.NumberFormatOptions = {
  maximumSignificantDigits: 17,
};

/** 数値の入力欄に渡す値。 */
type NumberFieldProps = {
  /** 入力欄の名前(フォームのキー)。 */
  readonly name: string;
  /** 入力欄のラベル。 */
  readonly label: string;
  /** 入力欄の補足。 */
  readonly description?: string;
  /** 最初に入れておく値。 */
  readonly defaultValue?: number;
  /** 入力が要るか。 */
  readonly isRequired?: boolean;
  /** 入力欄が無効か。 */
  readonly isDisabled?: boolean;
  /** 読み取り専用か。 */
  readonly isReadOnly?: boolean;
  /** 送る前に値を確かめ、誤りの知らせを返す関数(合っていれば undefined)。 */
  readonly validate?: (value: number) => string | undefined;
};

/** 数値の入力欄。 */
export const NumberField = ({
  name,
  label,
  description,
  defaultValue = Number.NaN,
  isRequired = false,
  isDisabled = false,
  isReadOnly = false,
  validate,
}: NumberFieldProps): ReactNode => {
  const { t } = useTranslation();

  return (
    <AriaNumberField
      className={fieldRoot()}
      decrementAriaLabel={t("ui.numberField.decrease", { label })}
      defaultValue={defaultValue}
      formatOptions={FORMAT_OPTIONS}
      incrementAriaLabel={t("ui.numberField.increase", { label })}
      isDisabled={isDisabled}
      isReadOnly={isReadOnly}
      isRequired={isRequired}
      isWheelDisabled
      name={name}
      validate={(value) => validate?.(value)}
    >
      <FieldLabel>{label}</FieldLabel>
      <Group
        className={fieldControl({
          className:
            "flex h-control items-stretch overflow-hidden focus-within:focus-ring",
        })}
      >
        <Input
          className={typography({
            role: "body",
            className: "min-w-0 flex-1 px-3 tabular-nums outline-hidden",
          })}
        />
        <StepButton slot="decrement" />
        <StepButton slot="increment" />
      </Group>
      {description !== undefined && (
        <FieldDescription>{description}</FieldDescription>
      )}
      <FieldErrorMessage />
    </AriaNumberField>
  );
};

/** 増減ボタンに渡す値。 */
type StepButtonProps = {
  /** React Aria Components の slot。 */
  readonly slot: "decrement" | "increment";
};

const StepButton = ({ slot }: StepButtonProps): ReactNode => (
  <Button
    className="flex shrink-0 items-center justify-center border-s border-line px-2 outline-hidden transition-colors is-hovered:state-hover is-focus-shown:focus-ring-inset is-disabled:text-fg-muted"
    slot={slot}
  >
    <svg
      aria-hidden="true"
      className="size-icon"
      fill="none"
      viewBox="0 0 16 16"
    >
      <path
        d={slot === "increment" ? "M4 8h8M8 4v8" : "M4 8h8"}
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  </Button>
);
