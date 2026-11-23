import { type ReactNode, useContext } from "react";
import {
  Button,
  Group,
  Input,
  NumberField as AriaNumberField,
  NumberFieldStateContext,
} from "react-aria-components";
import { useTranslation } from "react-i18next";

import {
  fieldControl,
  fieldRoot,
} from "@/ui/primitives/form-fields/field-control";
import {
  FieldDescription,
  FieldErrorMessage,
  FieldLabel,
} from "@/ui/primitives/form-fields/field-parts";
import { tv } from "@/ui/tv";
import { typography } from "@/ui/typography";

const FORMAT_OPTIONS: Intl.NumberFormatOptions = {
  maximumSignificantDigits: 17,
  useGrouping: false,
};

/** 数値の入力欄に渡す値。 */
export type NumberFieldProps = {
  /** 入力欄の名前(フォームのキー)。 */
  name: string;
  /** 入力欄のラベル。 */
  label: string;
  /** 入力欄の補足。 */
  description?: string | undefined;
  /** 最初に入れておく値。 */
  defaultValue?: number;
  /** 入力が要るか。 */
  isRequired?: boolean | undefined;
  /** 入力欄が無効か。 */
  isDisabled?: boolean | undefined;
  /** 読み取り専用か。 */
  isReadOnly?: boolean | undefined;
  /** 入力欄の検証の伝え方。 */
  validationBehavior?: "aria" | "native";
  /** 呼び出し元で管理する入力値。 */
  value?: number;
  /** 入力値が変わったときに呼ぶ関数。 */
  onChange?: (value: number) => void;
  /** 入力欄から focus が外れたときに呼ぶ関数。 */
  onBlur?: () => void;
  /** 呼び出し元から渡す誤りの知らせ。 */
  errorMessage?: string | undefined;
  /** 送る前に値を確かめ、誤りの知らせを返す関数(合っていれば undefined)。 */
  validate?: (value: number) => string | undefined;
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
  validationBehavior,
  value,
  onChange,
  onBlur,
  errorMessage,
  validate,
}: NumberFieldProps): ReactNode => {
  const { t } = useTranslation();
  const fieldState = {
    ...(errorMessage === undefined ? {} : { isInvalid: true }),
    ...(validationBehavior === undefined ? {} : { validationBehavior }),
    ...(value === undefined ? {} : { value }),
  };

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
      <Group
        className={fieldControl({
          className:
            "flex h-control items-stretch overflow-hidden focus-within:focus-ring",
        })}
      >
        <NumberInput committed={value} />
        <StepButton slot="decrement" />
        <StepButton slot="increment" />
      </Group>
      {description !== undefined && (
        <FieldDescription>{description}</FieldDescription>
      )}
      <FieldErrorMessage>{errorMessage}</FieldErrorMessage>
    </AriaNumberField>
  );
};

type NumberInputProps = {
  /** フォームが持つ確定済みの数値。 */
  committed: number | undefined;
};

const NumberInput = ({ committed }: NumberInputProps): ReactNode => {
  const state = useContext(NumberFieldStateContext);
  const uncommitted =
    committed !== undefined &&
    state !== null &&
    (!Object.is(committed, state.numberValue) ||
      (Number.isNaN(committed) && state.inputValue !== ""));

  return (
    <Input
      data-uncommitted-input={uncommitted || undefined}
      className={typography({
        role: "body",
        className: "min-w-0 flex-1 px-3 tabular-nums outline-hidden",
      })}
    />
  );
};

const stepButton = tv({
  base: [
    "flex shrink-0 items-center justify-center",
    "border-s px-2 outline-hidden transition-colors",
    "is-hovered:state-hover is-focus-shown:focus-ring-inset is-disabled:text-fg-muted",
  ],
});

/** 増減ボタンに渡す値。 */
type StepButtonProps = {
  /** React Aria Components の slot。 */
  slot: "decrement" | "increment";
};

const StepButton = ({ slot }: StepButtonProps): ReactNode => (
  <Button className={stepButton()} slot={slot}>
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
