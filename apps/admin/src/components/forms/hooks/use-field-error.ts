import { useSelector } from "@tanstack/react-form";

import { toFieldErrorMessage } from "../logic/to-field-error-message";
import { useFieldContext } from "./use-field-context";

/** 入力欄に表示する、現在の誤りの知らせ。 */
export const useFieldError = (): string | undefined => {
  const field = useFieldContext<unknown>();

  return useSelector(field.store, (state) =>
    toFieldErrorMessage(state.meta.errors),
  );
};
