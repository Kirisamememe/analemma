import type { ReactNode } from "react";
import { Select as AriaSelect } from "react-aria-components";

import { toSelectedValue } from "./logic/selected-value";

import { fieldRoot } from "@/ui/primitives/form-fields/field-control";

/** Select の選択肢。 */
export type SelectOption = {
  /** 選択肢の値。 */
  readonly value: string;
  /** 選択肢のラベル。 */
  readonly label: string;
};

/** 選択肢の入力に渡す値。 */
export type SelectInputProps = {
  /** フォームのキー。 */
  name?: string | undefined;
  /** アクセシブルな名前。 */
  "aria-label"?: string | undefined;
  /** 選択肢。 */
  options: readonly SelectOption[];
  /** 最初に選んでおく値。 */
  defaultValue?: string | undefined;
  /** 呼び出し元で管理する選択値。 */
  value?: string | null | undefined;
  /** 選択が必須か。 */
  isRequired?: boolean | undefined;
  /** 無効か。 */
  isDisabled?: boolean | undefined;
  /** 誤りがあるか。 */
  isInvalid?: boolean | undefined;
  /** 選択値が変わったときに呼ぶ関数。 */
  onChange?: ((value: string | null) => void) | undefined;
  /** focus が外れたときに呼ぶ関数。 */
  onBlur?: (() => void) | undefined;
  /** 入力の検証に使う React Aria Components の指定。 */
  validationBehavior?: "aria" | "native" | undefined;
};

type SelectRootProps = Omit<SelectInputProps, "options"> & {
  /** Select を構成する部品。 */
  children: ReactNode;
};

/** Select の状態と関連付けを子の部品に渡す。 */
export const SelectRoot = ({
  "aria-label": ariaLabel,
  name,
  defaultValue,
  isRequired = false,
  isDisabled = false,
  value,
  isInvalid,
  onBlur,
  onChange,
  validationBehavior,
  children,
}: SelectRootProps): ReactNode => {
  const selectedValue = value === null && !isRequired ? "" : value;

  const state = {
    ...(ariaLabel === undefined ? {} : { "aria-label": ariaLabel }),
    ...(name === undefined ? {} : { name }),
    ...(selectedValue === undefined ? {} : { value: selectedValue }),
    ...(isInvalid === undefined ? {} : { isInvalid }),
    ...(validationBehavior === undefined ? {} : { validationBehavior }),
  };

  return (
    <AriaSelect
      className={fieldRoot()}
      defaultValue={defaultValue ?? null}
      isDisabled={isDisabled}
      isRequired={isRequired}
      onBlur={() => {
        onBlur?.();
      }}
      onChange={(key) => {
        onChange?.(toSelectedValue(key));
      }}
      {...state}
    >
      {children}
    </AriaSelect>
  );
};
