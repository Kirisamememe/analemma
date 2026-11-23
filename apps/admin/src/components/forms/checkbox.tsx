import { useSelector } from "@tanstack/react-form";
import type { ReactNode } from "react";

import {
  useFieldContext,
  useFieldError,
  useIsSubmitting,
} from "./form-context";

import { Checkbox, type CheckboxProps } from "@/ui/primitives/form-fields";

type AppCheckboxProps = Pick<
  CheckboxProps,
  "description" | "isDisabled" | "isRequired" | "label"
>;

/** TanStack Form につないだ Checkbox。 */
export const AppCheckbox = (props: AppCheckboxProps): ReactNode => {
  const field = useFieldContext<boolean | null>();
  const value = useSelector(field.store, (state) => state.value);
  const errorMessage = useFieldError();
  const isSubmitting = useIsSubmitting();

  return (
    <Checkbox
      description={props.description}
      isDisabled={props.isDisabled}
      isReadOnly={isSubmitting}
      isRequired={props.isRequired}
      label={props.label}
      errorMessage={errorMessage}
      isSelected={value ?? false}
      name={field.name}
      onBlur={field.handleBlur}
      onChange={field.handleChange}
      validationBehavior="aria"
    />
  );
};
