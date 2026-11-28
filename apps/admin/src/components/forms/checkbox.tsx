import { useSelector } from "@tanstack/react-form";
import type { ReactNode } from "react";

import { useFieldContext } from "./hooks/use-field-context";
import { useFieldError } from "./hooks/use-field-error";
import { useIsSubmitting } from "./hooks/use-is-submitting";

import { useTranslate } from "@/i18n/use-translate";
import { Checkbox, type CheckboxProps } from "@/ui/primitives/form-fields";

type AppCheckboxProps = Pick<
  CheckboxProps,
  "description" | "isDisabled" | "label"
> & {
  /** 入力が要るか。 */
  isRequired?: boolean | undefined;
};

/** TanStack Form につないだ Checkbox。 */
export const AppCheckbox = (props: AppCheckboxProps): ReactNode => {
  const field = useFieldContext<boolean>();
  const value = useSelector(field.store, (state) => state.value);
  const errorMessage = useFieldError();
  const isSubmitting = useIsSubmitting();
  const t = useTranslate();

  return (
    <Checkbox
      description={props.description}
      isDisabled={props.isDisabled}
      isReadOnly={isSubmitting}
      requiredLabel={props.isRequired === true ? t("ui.required") : undefined}
      label={props.label}
      errorMessage={errorMessage}
      isSelected={value}
      name={field.name}
      onBlur={field.handleBlur}
      onChange={field.handleChange}
      validationBehavior="aria"
    />
  );
};
