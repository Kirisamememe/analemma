import { useSelector } from "@tanstack/react-form";
import type { ReactNode } from "react";

import {
  useFieldContext,
  useFieldError,
  useIsSubmitting,
} from "./form-context";

import {
  NumberField,
  type NumberFieldProps,
} from "@/ui/primitives/form-fields";

type AppNumberFieldProps = Pick<
  NumberFieldProps,
  "description" | "isDisabled" | "isReadOnly" | "isRequired" | "label"
>;

/** TanStack Form につないだ数値の入力欄。 */
export const AppNumberField = (props: AppNumberFieldProps): ReactNode => {
  const field = useFieldContext<number | null>();
  const value = useSelector(field.store, (state) => state.value);
  const errorMessage = useFieldError();
  const isSubmitting = useIsSubmitting();

  return (
    <NumberField
      description={props.description}
      errorMessage={errorMessage}
      isDisabled={props.isDisabled}
      isReadOnly={isSubmitting || props.isReadOnly === true}
      isRequired={props.isRequired}
      label={props.label}
      name={field.name}
      onBlur={field.handleBlur}
      onChange={(next) => {
        if (!field.form.state.isSubmitting) {
          field.handleChange(Number.isNaN(next) ? null : next);
        }
      }}
      validationBehavior="aria"
      value={value ?? Number.NaN}
    />
  );
};
