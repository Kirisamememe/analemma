import { useSelector } from "@tanstack/react-form";
import type { ReactNode } from "react";

import { useFieldContext, useFieldError } from "./form-context";

import { DateField, type DateFieldProps } from "@/ui/primitives/form-fields";

type AppDateFieldProps = Pick<
  DateFieldProps,
  "description" | "isDisabled" | "isReadOnly" | "isRequired" | "label"
>;

/** TanStack Form につないだ日付の入力欄。 */
export const AppDateField = (props: AppDateFieldProps): ReactNode => {
  const field = useFieldContext<string | null>();
  const value = useSelector(field.store, (state) => state.value);
  const errorMessage = useFieldError();

  return (
    <DateField
      description={props.description}
      isDisabled={props.isDisabled}
      isReadOnly={props.isReadOnly}
      isRequired={props.isRequired}
      label={props.label}
      errorMessage={errorMessage}
      name={field.name}
      onBlur={field.handleBlur}
      onChange={field.handleChange}
      validationBehavior="aria"
      value={value ?? null}
    />
  );
};
