import { createFormHookContexts, useSelector } from "@tanstack/react-form";

export const { fieldContext, formContext, useFieldContext } =
  createFormHookContexts();

/** フォームの誤りから表示する文言を取り出す。 */
export const toFieldErrorMessage = (
  errors: readonly unknown[],
): string | undefined => {
  const message = errors.filter((error) => typeof error === "string").join(" ");

  return message === "" ? undefined : message;
};

/** 入力欄に表示する、現在の誤りの知らせ。 */
export const useFieldError = (): string | undefined => {
  const field = useFieldContext<unknown>();

  return useSelector(field.store, (state) =>
    toFieldErrorMessage(state.meta.errors),
  );
};

/** フォームを送っている途中か(送信の検証の始めから、`onSubmit` が終わるまで)。 */
export const useIsSubmitting = (): boolean => {
  const field = useFieldContext<unknown>();

  return useSelector(field.form.store, (state) => state.isSubmitting);
};
