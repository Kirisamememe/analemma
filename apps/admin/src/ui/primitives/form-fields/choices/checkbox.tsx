import type { ReactNode } from "react";

import { CheckboxControl } from "./checkbox-control";
import { type CheckboxInputProps, CheckboxRoot } from "./checkbox-root";

import { FieldDescription } from "@/ui/primitives/form-fields/parts/field-description";
import { FieldErrorMessage } from "@/ui/primitives/form-fields/parts/field-error-message";

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
  isReadOnly,
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
    isReadOnly={isReadOnly}
    isRequired={isRequired}
    onBlur={onBlur}
    onChange={onChange}
    validationBehavior={validationBehavior}
  >
    <CheckboxControl isRequired={isRequired} label={label} />
    {description !== undefined && (
      <FieldDescription>{description}</FieldDescription>
    )}
    <FieldErrorMessage>{errorMessage}</FieldErrorMessage>
  </CheckboxRoot>
);
