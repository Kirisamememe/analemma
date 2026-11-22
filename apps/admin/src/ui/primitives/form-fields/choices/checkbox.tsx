import type { ReactNode } from "react";

import {
  CheckboxControl,
  type CheckboxInputProps,
  CheckboxRoot,
} from "./checkbox-input";

import {
  FieldDescription,
  FieldErrorMessage,
} from "@/ui/primitives/form-fields/field-parts";

/** ラベル付きの Checkbox に渡す値。 */
export type CheckboxProps = Omit<
  CheckboxInputProps,
  "aria-label" | "isInvalid" | "name"
> & {
  /** フォームのキー。 */
  name: string;
  /** ラベル。 */
  label: string;
  /** 補足。 */
  description?: string | undefined;
  /** 呼び出し元から渡す誤りの知らせ。 */
  errorMessage?: string | undefined;
};

/** ラベルと補足と誤りの知らせを持つ Checkbox。 */
export const Checkbox = ({
  name,
  label,
  description,
  errorMessage,
  defaultSelected,
  isSelected,
  isDisabled,
  isRequired,
  onBlur,
  onChange,
  validationBehavior,
}: CheckboxProps): ReactNode => (
  <CheckboxRoot
    isInvalid={errorMessage === undefined ? undefined : true}
    name={name}
    defaultSelected={defaultSelected}
    isSelected={isSelected}
    isDisabled={isDisabled}
    isRequired={isRequired}
    onBlur={onBlur}
    onChange={onChange}
    validationBehavior={validationBehavior}
  >
    <CheckboxControl label={label} />
    {description !== undefined && (
      <FieldDescription>{description}</FieldDescription>
    )}
    <FieldErrorMessage>{errorMessage}</FieldErrorMessage>
  </CheckboxRoot>
);
