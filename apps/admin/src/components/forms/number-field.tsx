import { useSelector } from "@tanstack/react-form";
import type { ReactNode } from "react";

import { useFieldContext } from "./hooks/use-field-context";
import { useFieldError } from "./hooks/use-field-error";
import { useIsSubmitting } from "./hooks/use-is-submitting";

import { useTranslate } from "@/i18n/use-translate";
import {
  NumberField,
  type NumberFieldProps,
} from "@/ui/primitives/form-fields";

type AppNumberFieldProps = Pick<
  NumberFieldProps,
  "description" | "isDisabled" | "isReadOnly" | "label"
> & {
  /** 入力が要るか。 */
  isRequired?: boolean | undefined;
};

/** TanStack Form につないだ数値の入力欄。 */
export const AppNumberField = (props: AppNumberFieldProps): ReactNode => {
  const field = useFieldContext<number | null>();
  const value = useSelector(field.store, (state) => state.value);
  const errorMessage = useFieldError();
  const isSubmitting = useIsSubmitting();
  const t = useTranslate();

  return (
    <NumberField
      description={props.description}
      errorMessage={errorMessage}
      isDisabled={props.isDisabled}
      isReadOnly={isSubmitting || props.isReadOnly === true}
      requiredLabel={props.isRequired === true ? t("ui.required") : undefined}
      decrementLabel={t("ui.numberField.decrease", { label: props.label })}
      incrementLabel={t("ui.numberField.increase", { label: props.label })}
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
