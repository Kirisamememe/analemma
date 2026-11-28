import type { ReactNode } from "react";

import { SelectControl } from "./select-control";
import { type SelectInputProps, SelectRoot } from "./select-root";

import { FieldDescription } from "@/ui/primitives/form-fields/parts/field-description";
import { FieldErrorMessage } from "@/ui/primitives/form-fields/parts/field-error-message";
import { FieldLabel } from "@/ui/primitives/form-fields/parts/field-label";

/** ラベル付きの Select に渡す値。 */
export type SelectProps = Omit<
  SelectInputProps,
  "aria-label" | "isInvalid" | "isRequired" | "name"
> & {
  /** フォームのキー。 */
  name: string;
  /** ラベル。 */
  label: string;
  /** 入力が要ることを示す文言。 */
  requiredLabel?: string | undefined;
  /** 入力が任意であることを示す文言。 */
  optionalLabel?: string | undefined;
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
  requiredLabel,
  optionalLabel,
  onBlur,
  onChange,
  validationBehavior,
  options,
  placeholder,
  noneLabel,
}: SelectProps): ReactNode => (
  <SelectRoot
    isInvalid={errorMessage === undefined ? undefined : true}
    name={name}
    defaultValue={defaultValue}
    value={value}
    isDisabled={isDisabled}
    isRequired={requiredLabel !== undefined}
    onBlur={onBlur}
    onChange={onChange}
    validationBehavior={validationBehavior}
  >
    <FieldLabel optionalLabel={optionalLabel} requiredLabel={requiredLabel}>
      {label}
    </FieldLabel>
    <SelectControl
      isRequired={requiredLabel !== undefined}
      noneLabel={noneLabel}
      options={options}
      placeholder={placeholder}
    />
    {description !== undefined && (
      <FieldDescription>{description}</FieldDescription>
    )}
    <FieldErrorMessage>{errorMessage}</FieldErrorMessage>
  </SelectRoot>
);
