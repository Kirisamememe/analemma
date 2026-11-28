import { z } from "zod";

import { imageTagId } from "./image-tag-values";
import { imageId, imageTitle } from "./image-values";

/** 画像一覧のタグの条件。 */
export const imageListFilter = z.object({
  tags: z
    .union([
      z.literal("untagged"),
      z.array(imageTagId.toLowerCase()).transform((ids) => [...new Set(ids)]),
    ])
    .optional()
    .describe("タグ無しは untagged。タグの ID を省くか空にすると全件。"),
  match: z
    .enum(["any", "all"])
    .optional()
    .describe("選んだタグのいずれかを含む(any、既定)か、すべて含む(all)か。"),
});

/** 画像一覧の絞り込みと並び順。 */
export const imageListOptions = imageListFilter.extend({
  order: z
    .enum(["added", "title"])
    .optional()
    .describe("新しく足した順(added、既定)か、タイトル順(title)か。"),
});

/** cursor に含まれる画像の ID とタイトルを読む。 */
export const readImageCursor = (cursor: string) => {
  const separator = cursor.indexOf(":");

  return separator < 0
    ? { id: cursor, title: null }
    : {
        id: cursor.slice(0, separator),
        title: cursor.slice(separator + 1) || null,
      };
};

const titleCursor = z.string().refine((value) => {
  const { id, title } = readImageCursor(value);

  return (
    value.includes(":") &&
    imageId.safeParse(id).success &&
    (title === null || imageTitle.safeParse(title).success)
  );
});

/** 画像一覧の次のページを読む cursor。 */
export const imageListCursor = z.union([imageId, titleCursor]);

/** 画像一覧の1ページを読む条件。 */
export const imageListPage = imageListOptions
  .extend({
    cursor: imageListCursor
      .optional()
      .describe("前のページの nextCursor。省くと最初のページ。"),
    limit: z.int().min(1).max(100).default(50).describe("1ページの件数。"),
  })
  .refine(
    ({ order, cursor }) =>
      cursor === undefined || (order === "title") === cursor.includes(":"),
    { error: "並び順に合う cursor を指定する", path: ["cursor"] },
  );
