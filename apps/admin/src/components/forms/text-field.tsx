import { useSelector } from "@tanstack/react-form";
import type { ReactNode } from "react";

import { useFieldContext } from "./hooks/use-field-context";
import { useFieldError } from "./hooks/use-field-error";
import { useIsSubmitting } from "./hooks/use-is-submitting";

import { useTranslate } from "@/i18n/use-translate";
import { TextField, type TextFieldProps } from "@/ui/primitives/form-fields";

type AppTextFieldProps = Pick<
  TextFieldProps,
  | "autoComplete"
  | "inputRef"
  | "description"
  | "isReadOnly"
  | "label"
  | "maxLength"
  | "placeholder"
> & {
  /** 入力が要るか。 */
  isRequired?: boolean | undefined;
};

/** TanStack Form につないだ1行の入力欄。 */
export const AppTextField = ({
  autoComplete,
  inputRef,
  description,
  isReadOnly,
  isRequired,
  label,
  maxLength,
  placeholder,
}: AppTextFieldProps): ReactNode => {
  const field = useFieldContext<string | undefined>();
  const value = useSelector(field.store, (state) => state.value);
  const errorMessage = useFieldError();
  const isSubmitting = useIsSubmitting();
  const t = useTranslate();

  return (
    <TextField
      autoComplete={autoComplete}
      description={description}
      errorMessage={errorMessage}
      inputRef={inputRef}
      isReadOnly={isSubmitting || isReadOnly === true}
      optionalLabel={isRequired === true ? undefined : t("ui.optional")}
      requiredLabel={isRequired === true ? t("ui.required") : undefined}
      label={label}
      maxLength={maxLength}
      name={field.name}
      placeholder={placeholder}
      onBlur={field.handleBlur}
      onChange={field.handleChange}
      validationBehavior="aria"
      value={value ?? ""}
    />
  );
};
