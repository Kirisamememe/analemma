import { createFormHook } from "@tanstack/react-form";

import { fieldContext, formContext } from "./form-context";
import { AppTextField } from "./text-field";

export const { useAppForm } = createFormHook({
  fieldComponents: { TextField: AppTextField },
  fieldContext,
  formComponents: {},
  formContext,
});
