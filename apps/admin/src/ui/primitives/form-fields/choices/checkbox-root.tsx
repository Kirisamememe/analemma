import type { ReactNode } from "react";
import { CheckboxField } from "react-aria-components";

import { fieldRoot } from "@/ui/primitives/form-fields/field-control";

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
  /** 読み取り専用か。 */
  isReadOnly?: boolean | undefined;
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
  isReadOnly = false,
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
      isReadOnly={isReadOnly}
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
