import type { ContentForm, ContentFormValue } from "../content-form";

/** 項目のフォームの値が group のものかを確かめる。 */
export const isFormGroup = (
  value: ContentFormValue | undefined,
): value is ContentForm =>
  typeof value === "object" && value !== null && !Array.isArray(value);
