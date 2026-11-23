import { useSelector } from "@tanstack/react-form";
import type { ReactNode } from "react";

import { useFieldContext, useFieldError } from "./form-context";

import { Select, type SelectProps } from "@/ui/primitives/form-fields";

type AppSelectProps = Pick<
  SelectProps,
  "description" | "isDisabled" | "isRequired" | "label" | "options"
>;

/** TanStack Form につないだ Select。 */
export const AppSelect = (props: AppSelectProps): ReactNode => {
  const field = useFieldContext<string | null>();
  const value = useSelector(field.store, (state) => state.value);
  const errorMessage = useFieldError();

  return (
    <Select
      description={props.description}
      isDisabled={props.isDisabled}
      isRequired={props.isRequired}
      label={props.label}
      options={props.options}
      errorMessage={errorMessage}
      name={field.name}
      onBlur={field.handleBlur}
      onChange={(next) => {
        if (!field.form.state.isSubmitting) {
          field.handleChange(next);
        }
      }}
      validationBehavior="aria"
      value={value ?? null}
    />
  );
};
