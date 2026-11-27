import type { ReactNode } from "react";

import { CheckboxControl } from "./checkbox-control";
import { type CheckboxInputProps, CheckboxRoot } from "./checkbox-root";

/** ラベルを呼び出し元で付ける Checkbox。 */
export const CheckboxInput = ({
  "aria-label": ariaLabel,
  name,
  defaultSelected,
  isSelected,
  isDisabled,
  isReadOnly,
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
    isReadOnly={isReadOnly}
    isInvalid={isInvalid}
    isRequired={isRequired}
    onBlur={onBlur}
    onChange={onChange}
    validationBehavior={validationBehavior}
  >
    <CheckboxControl />
  </CheckboxRoot>
);
