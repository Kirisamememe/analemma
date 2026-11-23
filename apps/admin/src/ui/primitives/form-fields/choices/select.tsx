import type { ReactNode } from "react";

import {
  SelectControl,
  type SelectInputProps,
  SelectRoot,
} from "./select-input";

import {
  FieldDescription,
  FieldErrorMessage,
  FieldLabel,
} from "@/ui/primitives/form-fields/field-parts";

/** ラベル付きの Select に渡す値。 */
export type SelectProps = Omit<
  SelectInputProps,
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

/** ラベルと補足と誤りの知らせを持つ Select。 */
export const Select = ({
  name,
  label,
  description,
  errorMessage,
  defaultValue,
  value,
  isDisabled,
  isRequired,
  onBlur,
  onChange,
  validationBehavior,
  options,
}: SelectProps): ReactNode => (
  <SelectRoot
    isInvalid={errorMessage === undefined ? undefined : true}
    name={name}
    defaultValue={defaultValue}
    value={value}
    isDisabled={isDisabled}
    isRequired={isRequired}
    onBlur={onBlur}
    onChange={onChange}
    validationBehavior={validationBehavior}
  >
    <FieldLabel isRequired={isRequired}>{label}</FieldLabel>
    <SelectControl isRequired={isRequired} options={options} />
    {description !== undefined && (
      <FieldDescription>{description}</FieldDescription>
    )}
    <FieldErrorMessage>{errorMessage}</FieldErrorMessage>
  </SelectRoot>
);
