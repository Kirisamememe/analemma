import { createFormHook } from "@tanstack/react-form";

import { AppCheckbox } from "./checkbox";
import { AppDateField } from "./date-field";
import { fieldContext, formContext } from "./form-context";
import { AppNumberField } from "./number-field";
import { AppSelect } from "./select";
import { AppTextArea } from "./text-area";
import { AppTextField } from "./text-field";

export const { useAppForm } = createFormHook({
  fieldComponents: {
    Checkbox: AppCheckbox,
    DateField: AppDateField,
    NumberField: AppNumberField,
    Select: AppSelect,
    TextArea: AppTextArea,
    TextField: AppTextField,
  },
  fieldContext,
  formComponents: {},
  formContext,
});
