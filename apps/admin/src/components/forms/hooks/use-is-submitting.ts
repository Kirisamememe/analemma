import { useSelector } from "@tanstack/react-form";

import { useFieldContext } from "./use-field-context";

/** フォームを送っている途中か(送信の検証の始めから、`onSubmit` が終わるまで)。 */
export const useIsSubmitting = (): boolean => {
  const field = useFieldContext<unknown>();

  return useSelector(field.form.store, (state) => state.isSubmitting);
};
