import {
  type FieldDefinition,
  type FixedPageContent,
  toContentSchema,
} from "@analemma/contract";

import { createContentForm } from "../content-form";
import {
  type EditorBase,
  type EditorValues,
  flattenContent,
} from "./logic/flat-content";

/** フォームを作るときに決まる値と、フォームの最初の値。 */
type EditorStart = EditorBase & {
  /** フォームの最初の値。 */
  readonly values: EditorValues;
};

/** 保存した固定ページのうち、フォームで編集する値。 */
type StoredPage = {
  /** slug。 */
  readonly slug: string;
  /** タイトル。 */
  readonly title: string;
  /** 中身。 */
  readonly content: FixedPageContent;
};

/** 種類の定義と保存した固定ページ(作成なら無し)から、フォームの最初の値を作る。 */
export const createEditorValues = (
  fields: readonly FieldDefinition[],
  page?: StoredPage,
): EditorStart => {
  const { content, items, unknownKeys } = flattenContent(
    createContentForm(fields, page?.content),
  );

  return {
    fields,
    unknownKeys,
    values: {
      slug: page?.slug ?? "",
      title: page?.title ?? "",
      content,
      items,
    },
  };
};

/** 取得済みの定義で保存した中身を編集できるかを確かめる。 */
export const storedContentCheck = (content?: FixedPageContent) => {
  const checked = new WeakMap<readonly FieldDefinition[], boolean>();
  return (fields: readonly FieldDefinition[]): boolean => {
    if (content === undefined) return true;

    const known = checked.get(fields);

    if (known !== undefined) return known;

    const result = toContentSchema({ fields, unknownKeys: "keep" }).safeParse(
      content,
      { reportInput: true },
    );

    const usable =
      result.success ||
      result.error.issues.every((issue) => issue.input === undefined);

    checked.set(fields, usable);

    return usable;
  };
};
