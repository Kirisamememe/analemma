/** フォームの誤りから表示する文言を取り出す。 */
export const toFieldErrorMessage = (
  errors: readonly unknown[],
): string | undefined => {
  const message = errors.filter((error) => typeof error === "string").join(" ");

  return message === "" ? undefined : message;
};
