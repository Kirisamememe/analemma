import { createFormHook } from "@tanstack/react-form";

import { fieldContext, formContext } from "./hooks/form-contexts";

const { useAppForm } = createFormHook({
  fieldComponents: {},
  fieldContext,
  formComponents: {},
  formContext,
});

export { useAppForm };
