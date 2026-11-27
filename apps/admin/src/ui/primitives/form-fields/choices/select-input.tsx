import type { ReactNode } from "react";

import { SelectControl } from "./select-control";
import { type SelectInputProps, SelectRoot } from "./select-root";

/** 選択肢から1つを選ぶ入力。 */
export const SelectInput = ({
  "aria-label": ariaLabel,
  name,
  defaultValue,
  value,
  isDisabled,
  isInvalid,
  isRequired,
  onBlur,
  onChange,
  validationBehavior,
  options,
}: SelectInputProps): ReactNode => (
  <SelectRoot
    aria-label={ariaLabel}
    name={name}
    defaultValue={defaultValue}
    value={value}
    isDisabled={isDisabled}
    isInvalid={isInvalid}
    isRequired={isRequired}
    onBlur={onBlur}
    onChange={onChange}
    validationBehavior={validationBehavior}
  >
    <SelectControl isRequired={isRequired} options={options} />
  </SelectRoot>
);
