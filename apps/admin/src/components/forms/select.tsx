import { useSelector } from "@tanstack/react-form";
import type { ReactNode } from "react";

import { useFieldContext } from "./hooks/use-field-context";
import { useFieldError } from "./hooks/use-field-error";

import { useTranslate } from "@/i18n/use-translate";
import { Select, type SelectProps } from "@/ui/primitives/form-fields";

type AppSelectProps = Pick<
  SelectProps,
  "description" | "isDisabled" | "label" | "options"
> & {
  /** 入力が要るか。 */
  isRequired?: boolean | undefined;
};

/** TanStack Form につないだ Select。 */
export const AppSelect = (props: AppSelectProps): ReactNode => {
  const field = useFieldContext<string | null>();
  const value = useSelector(field.store, (state) => state.value);
  const errorMessage = useFieldError();
  const t = useTranslate();

  return (
    <Select
      description={props.description}
      isDisabled={props.isDisabled}
      optionalLabel={props.isRequired === true ? undefined : t("ui.optional")}
      requiredLabel={props.isRequired === true ? t("ui.required") : undefined}
      noneLabel={t("ui.select.none")}
      placeholder={t("ui.select.placeholder")}
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
