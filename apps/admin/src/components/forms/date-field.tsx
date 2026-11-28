import { useSelector } from "@tanstack/react-form";
import type { ReactNode } from "react";

import { useFieldContext } from "./hooks/use-field-context";
import { useFieldError } from "./hooks/use-field-error";
import { useIsSubmitting } from "./hooks/use-is-submitting";

import { useTranslate } from "@/i18n/use-translate";
import { DateField, type DateFieldProps } from "@/ui/primitives/form-fields";

type AppDateFieldProps = Pick<
  DateFieldProps,
  "description" | "isDisabled" | "isReadOnly" | "label"
> & {
  /** 入力が要るか。 */
  isRequired?: boolean | undefined;
};

/** TanStack Form につないだ日付の入力欄。 */
export const AppDateField = (props: AppDateFieldProps): ReactNode => {
  const field = useFieldContext<string | null>();
  const value = useSelector(field.store, (state) => state.value);
  const errorMessage = useFieldError();
  const isSubmitting = useIsSubmitting();
  const t = useTranslate();

  return (
    <DateField
      description={props.description}
      isDisabled={props.isDisabled}
      isReadOnly={isSubmitting || props.isReadOnly === true}
      requiredLabel={props.isRequired === true ? t("ui.required") : undefined}
      incompleteMessage={t("ui.dateField.incomplete")}
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
