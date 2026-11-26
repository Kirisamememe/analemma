/** 中身に保存した画像の ID と、その値がある場所。 */
type ContentImage = {
  /** 小文字にそろえた画像の ID。 */
  readonly id: string;
  /** 画像の項目を持つオブジェクト。 */
  readonly parent: Record<string, unknown>;
  /** 画像の項目のキー。 */
  readonly key: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** 保存済みの項目の型とキーをたどり、中身から画像の項目を探す。 */
export const findContentImages = (
  fields: unknown,
  content: unknown,
): ContentImage[] => {
  if (!isRecord(content)) return [];

  if (!Array.isArray(fields)) throw new TypeError("項目の定義が配列ではない");

  return fields.flatMap((field: unknown): ContentImage[] => {
    if (!isRecord(field)) throw new Error("項目の定義がオブジェクトではない");

    const { key, type, fields: nested } = field;

    if (typeof key !== "string" || typeof type !== "string") {
      throw new TypeError("項目のキーと型が必要");
    }

    if (!Object.hasOwn(content, key)) return [];

    const value = content[key];

    if (type === "image" && typeof value === "string") {
      return [{ id: value.toLowerCase(), parent: content, key }];
    }

    if (type === "group") return findContentImages(nested, value);

    if (type === "repeat" && Array.isArray(value)) {
      return value.flatMap((item: unknown) => findContentImages(nested, item));
    }

    return [];
  });
};
