import type { ReactNode } from "react";
import { CheckboxButton, CheckboxField } from "react-aria-components";

import { fieldRoot } from "@/ui/primitives/form-fields/field-control";
import { typography } from "@/ui/typography";

/** チェックの切り替えに渡す値。 */
export type CheckboxInputProps = {
  /** フォームのキー。 */
  name?: string | undefined;
  /** アクセシブルな名前。 */
  "aria-label"?: string | undefined;
  /** 最初からチェックしているか。 */
  defaultSelected?: boolean | undefined;
  /** 呼び出し元で管理するチェックの状態。 */
  isSelected?: boolean | undefined;
  /** チェックが必須か。 */
  isRequired?: boolean | undefined;
  /** 無効か。 */
  isDisabled?: boolean | undefined;
  /** 誤りがあるか。 */
  isInvalid?: boolean | undefined;
  /** チェックの状態が変わったときに呼ぶ関数。 */
  onChange?: ((value: boolean) => void) | undefined;
  /** focus が外れたときに呼ぶ関数。 */
  onBlur?: (() => void) | undefined;
  /** 入力の検証に使う React Aria Components の指定。 */
  validationBehavior?: "aria" | "native" | undefined;
};

type CheckboxRootProps = CheckboxInputProps & {
  /** Checkbox を構成する部品。 */
  children: ReactNode;
};

/** Checkbox の状態と関連付けを子の部品に渡す。 */
export const CheckboxRoot = ({
  "aria-label": ariaLabel,
  name,
  isRequired = false,
  isDisabled = false,
  defaultSelected = false,
  isSelected,
  isInvalid,
  onBlur,
  onChange,
  validationBehavior,
  children,
}: CheckboxRootProps): ReactNode => {
  const state = {
    ...(ariaLabel === undefined ? {} : { "aria-label": ariaLabel }),
    ...(name === undefined ? {} : { name }),
    ...(isSelected === undefined ? {} : { isSelected }),
    ...(isInvalid === undefined ? {} : { isInvalid }),
    ...(validationBehavior === undefined ? {} : { validationBehavior }),
  };

  return (
    <CheckboxField
      className={fieldRoot()}
      defaultSelected={defaultSelected}
      isDisabled={isDisabled}
      isRequired={isRequired}
      onBlur={() => {
        onBlur?.();
      }}
      onChange={(selected) => {
        onChange?.(selected);
      }}
      value="true"
      // oxlint-disable-next-line project/styling-boundary -- React Aria の未指定の props を省く。見た目の props は含まない。
      {...state}
    >
      {children}
    </CheckboxField>
  );
};

const CheckMark = (): ReactNode => (
  <svg
    aria-hidden="true"
    className="size-icon shrink-0 opacity-0 transition-opacity group-is-selected:opacity-100"
    fill="none"
    viewBox="0 0 16 16"
  >
    <path
      d="M4.25 8.25 6.75 10.75l5-5.5"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.75"
    />
  </svg>
);

type CheckboxControlProps = {
  /** チェックに添えるラベル。 */
  label?: string;
};

/** チェックを切り替えるボタン。 */
export const CheckboxControl = ({ label }: CheckboxControlProps): ReactNode => (
  <CheckboxButton
    className={typography({
      role: "label",
      className:
        "group flex items-start gap-2 py-0.5 text-fg is-disabled:state-disabled",
    })}
  >
    <span aria-hidden="true" className="flex h-5 shrink-0 items-center">
      <span className="flex size-icon items-center justify-center rounded-xs border border-line-strong bg-surface shadow-control transition group-is-hovered:state-hover group-is-focus-shown:focus-ring group-is-pressed:state-pressed group-is-selected:border-primary group-is-selected:bg-primary group-is-selected:text-on-primary group-is-invalid:border-danger not-forced-colors:group-is-invalid:outline-danger">
        <CheckMark />
      </span>
    </span>
    {label !== undefined && <span className="wrap-anywhere">{label}</span>}
  </CheckboxButton>
);

/** ラベルを呼び出し元で付ける Checkbox。 */
export const CheckboxInput = ({
  "aria-label": ariaLabel,
  name,
  defaultSelected,
  isSelected,
  isDisabled,
  isInvalid,
  isRequired,
  onBlur,
  onChange,
  validationBehavior,
}: CheckboxInputProps): ReactNode => (
  <CheckboxRoot
    aria-label={ariaLabel}
    name={name}
    defaultSelected={defaultSelected}
    isSelected={isSelected}
    isDisabled={isDisabled}
    isInvalid={isInvalid}
    isRequired={isRequired}
    onBlur={onBlur}
    onChange={onChange}
    validationBehavior={validationBehavior}
  >
    <CheckboxControl />
  </CheckboxRoot>
);
