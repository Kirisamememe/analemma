import { createFormHook } from "@tanstack/react-form";

import { AppCheckbox } from "./checkbox";
import { AppDateField } from "./date-field";
import { fieldContext, formContext } from "./form-context";
import { AppSelect } from "./select";
import { AppTextField } from "./text-field";

export const { useAppForm } = createFormHook({
  fieldComponents: {
    Checkbox: AppCheckbox,
    DateField: AppDateField,
    Select: AppSelect,
    TextField: AppTextField,
  },
  fieldContext,
  formComponents: {},
  formContext,
});
