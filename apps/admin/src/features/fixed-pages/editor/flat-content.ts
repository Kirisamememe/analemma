import type { FieldDefinition, FixedPageContent } from "@analemma/contract";

import {
  type ContentForm,
  type ContentFormValue,
  isFormGroup,
} from "../content-form";

/** フォームで編集する項目の値と repeat の並び。 */
export type FlatContent = {
  /** 項目の場所ごとの値。 */
  content: Record<string, string | number | boolean | null>;
  /** repeat の場所ごとの要素の ID。 */
  items: Record<string, string[]>;
};

type UnknownKeys = Map<string, FixedPageContent>;

/** 各段を、項目のキーと要素の ID でたどれる形にする。 */
export const flattenContent = (form: ContentForm, prefix = "") => {
  const flat: FlatContent = { content: {}, items: {} };
  const unknownKeys: UnknownKeys = new Map();
  const visit = (group: ContentForm, parent: string): void => {
    unknownKeys.set(parent, group.unknownKeys);

    for (const [key, value] of Object.entries(group.values)) {
      const path = parent + key;

      if (isFormGroup(value)) visit(value, path + "/");
      else if (Array.isArray(value)) {
        flat.items[path] = value.map(({ id }) => id);

        for (const item of value) visit(item.value, path + "/" + item.id + "/");
      } else flat.content[path] = value;
    }
  };

  visit(form, prefix);

  return { ...flat, unknownKeys };
};

/** 現在の並びに残る値と、その段の定義に無いキーからフォームを組み直す。 */
export const restoreContent = (
  fields: readonly FieldDefinition[],
  flat: ReturnType<typeof flattenContent>,
): ContentForm => {
  const visit = (
    definitions: readonly FieldDefinition[],
    prefix: string,
  ): ContentForm => ({
    unknownKeys: flat.unknownKeys.get(prefix) ?? {},
    values: Object.fromEntries(
      definitions.map((field): [string, ContentFormValue] => {
        const path = prefix + field.key;

        if (field.type === "group") {
          return [field.key, visit(field.fields, path + "/")];
        }

        if (field.type === "repeat") {
          return [
            field.key,
            (flat.items[path] ?? []).map((id) => ({
              id,
              value: visit(field.fields, path + "/" + id + "/"),
            })),
          ];
        }

        return [field.key, flat.content[path] ?? null];
      }),
    ),
  });

  return visit(fields, "");
};
