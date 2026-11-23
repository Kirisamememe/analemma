import type { FieldDefinition, FixedPageContent } from "@analemma/contract";

/** 中身に保存した画像の ID と、その値がある場所。 */
type ContentImage = {
  /** 小文字にそろえた画像の ID。 */
  readonly id: string;
  /** 画像の項目を持つオブジェクト。 */
  readonly parent: FixedPageContent;
  /** 画像の項目のキー。 */
  readonly key: string;
};

/** 定義に従って、グループと繰り返しの中も含めて画像の項目を探す。 */
export const findContentImages = (
  fields: readonly FieldDefinition[],
  content: FixedPageContent[string] | undefined,
): ContentImage[] => {
  if (
    content === null ||
    typeof content !== "object" ||
    Array.isArray(content)
  ) {
    return [];
  }

  return fields.flatMap((field): ContentImage[] => {
    const { key } = field;
    const value = content[key];

    if (field.type === "image" && typeof value === "string") {
      return [{ id: value.toLowerCase(), parent: content, key }];
    }

    if (field.type === "group") {
      return findContentImages(field.fields, value);
    }

    if (field.type === "repeat" && Array.isArray(value)) {
      return value.flatMap((item) => findContentImages(field.fields, item));
    }

    return [];
  });
};
