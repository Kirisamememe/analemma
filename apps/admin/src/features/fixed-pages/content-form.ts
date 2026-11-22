import {
  type FieldDefinition,
  type FixedPageContent,
  booleanValue,
  dateValue,
  longTextValue,
  numberValue,
  textValue,
  urlValue,
} from "@analemma/contract";

/** repeat の要素。 */
export type RepeatItem = {
  /** フォームの中で要素を指す ID。 */
  readonly id: string;
  /** 要素の中のフォームの値。 */
  readonly value: ContentForm;
};

/** フォームの項目の値。 */
export type ContentFormValue =
  | string
  | number
  | boolean
  | null
  | ContentForm
  | RepeatItem[];

/** 固定ページの中身のフォームの1段。 */
export type ContentForm = {
  /** 項目のキーとフォームの値の組。 */
  readonly values: Readonly<Record<string, ContentFormValue>>;
  /** この段の定義に無いキーと保存値の組。 */
  readonly unknownKeys: FixedPageContent;
};

/** フォームの値が group かを確かめる。 */
export const isFormGroup = (
  value: ContentFormValue | undefined,
): value is ContentForm =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const groupContent = (
  value: FixedPageContent[string] | undefined,
): FixedPageContent =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? value
    : {};

const readField = (
  field: FieldDefinition,
  content: FixedPageContent | undefined,
): ContentFormValue => {
  const value = content?.[field.key];

  switch (field.type) {
    case "text":
      return textValue.safeParse(value).data ?? "";
    case "longText":
      return longTextValue.safeParse(value).data ?? "";
    case "url":
      return typeof value === "string" && urlValue.safeParse(value).success
        ? value
        : "";
    case "number":
      return numberValue.safeParse(value).data ?? null;
    case "boolean":
      return content === undefined && !field.optional
        ? false
        : (booleanValue.safeParse(value).data ?? null);
    case "date":
      return dateValue.safeParse(value).data ?? null;
    case "select":
      return (
        field.options.find((option) => option.value === value)?.value ?? null
      );
    case "group":
      return createContentForm(
        field.fields,
        content === undefined ? undefined : groupContent(value),
      );
    case "repeat":
      return Array.isArray(value)
        ? value.map((item) => ({
            id: crypto.randomUUID(),
            value: createContentForm(field.fields, groupContent(item)),
          }))
        : [];
  }
};

/** 種類の定義と保存値からフォームの値を作る。 */
export const createContentForm = (
  fields: readonly FieldDefinition[],
  content?: FixedPageContent,
): ContentForm => {
  const keys = new Set(fields.map(({ key }) => key));

  return {
    values: Object.fromEntries(
      fields.map((field) => [field.key, readField(field, content)]),
    ),
    unknownKeys: Object.fromEntries(
      Object.entries(content ?? {}).filter(([key]) => !keys.has(key)),
    ),
  };
};
