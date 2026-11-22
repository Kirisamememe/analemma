import { useSelector } from "@tanstack/react-form";
import type { ReactNode } from "react";

import { useFieldContext } from "./form-context";

import { TextField, type TextFieldProps } from "@/ui/primitives/form-fields";

type AppTextFieldProps = Pick<
  TextFieldProps,
  "autoComplete" | "description" | "isRequired" | "label" | "maxLength"
>;

/** TanStack Form につないだ1行の入力欄。 */
export const AppTextField = ({
  autoComplete,
  description,
  isRequired,
  label,
  maxLength,
}: AppTextFieldProps): ReactNode => {
  const field = useFieldContext<string | undefined>();
  const value = useSelector(field.store, (state) => state.value);
  const errors = useSelector(
    field.store,
    (state): readonly unknown[] => state.meta.errors,
  );
  const errorMessage = errors
    .filter((error) => typeof error === "string")
    .join(" ");

  return (
    <TextField
      autoComplete={autoComplete}
      description={description}
      errorMessage={errorMessage === "" ? undefined : errorMessage}
      isRequired={isRequired}
      label={label}
      maxLength={maxLength}
      name={field.name}
      onBlur={field.handleBlur}
      onChange={field.handleChange}
      validationBehavior="aria"
      value={value ?? ""}
    />
  );
};
