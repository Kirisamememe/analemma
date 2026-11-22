import type { FieldDefinition, FixedPageContent } from "@analemma/contract";

import { type ContentForm, isFormGroup } from "./content-form";

type GroupContent = {
  /** この段から送る中身。 */
  readonly content: FixedPageContent;
  /** この段か内側に、入力した値・repeat の要素・定義に無いキーがあるか。 */
  readonly hasInput: boolean;
};

const writeGroup = (
  fields: readonly FieldDefinition[],
  form: ContentForm,
): GroupContent => {
  const entries = Object.entries(form.unknownKeys);
  let hasInput = entries.length > 0;

  for (const field of fields) {
    const value = form.values[field.key];

    if (field.type === "group" && isFormGroup(value)) {
      const nested = writeGroup(field.fields, value);

      if (!field.optional || nested.hasInput) {
        entries.push([field.key, nested.content]);
      }

      hasInput ||= nested.hasInput;
    } else if (field.type === "repeat" && Array.isArray(value)) {
      if (!field.optional || value.length > 0) {
        entries.push([
          field.key,
          value.map((item) => writeGroup(field.fields, item.value).content),
        ]);
      }

      hasInput ||= value.length > 0;
    } else if (
      value !== undefined &&
      value !== "" &&
      typeof value !== "object"
    ) {
      entries.push([field.key, value]);
      hasInput ||=
        field.type !== "boolean" || field.optional || value !== false;
    }
  }

  return { content: Object.fromEntries(entries), hasInput };
};

/** フォームから、固定ページの保存で送る中身を作る。 */
export const toFixedPageContent = (
  fields: readonly FieldDefinition[],
  form: ContentForm,
): FixedPageContent => writeGroup(fields, form).content;
