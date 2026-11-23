import { imageAlt, imageDescription, imageTitle } from "@analemma/contract";

import type { AdminImage } from "@/queries/image-query";

import type { ApiInputs } from "@/api/api-types";

/** 画像のフォームで書き換える、タイトル・説明・alt の入力。 */
export type ImageText = Record<"title" | "description" | "alt", string>;

/** 画像のフォームの欄の名前。 */
type ImageTextName = keyof ImageText;

/** 画像のフォームに並ぶ欄。 */
export const imageTextFields = ["title", "description", "alt"] as const;

/** 画像の入力欄の保存に使う contract の定義。 */
export const imageTextSchemas = {
  title: imageTitle,
  description: imageDescription,
  alt: imageAlt,
};

const toNullable = (value: string): string | null => {
  const text = value.trim();

  return text === "" ? null : text;
};

/** 画像のタイトル・説明・alt から、フォームの初期値を作る。 */
export const toImageText = ({
  title,
  description,
  alt,
}: Pick<AdminImage, ImageTextName>): ImageText => ({
  title: title ?? "",
  description: description ?? "",
  alt: alt ?? "",
});

/** フォームの値から、書き換えで送る値を作る。 */
export const toUpdateInput = (
  values: ImageText,
): Omit<ApiInputs["admin"]["images"]["update"], "id"> => ({
  title: toNullable(values.title),
  description: toNullable(values.description),
  alt: toNullable(values.alt),
});

/** 欄の値が、空にするか、server が受け付ける値か。 */
export const isValidImageText = (name: ImageTextName, value: string): boolean =>
  toNullable(value) === null || imageTextSchemas[name].safeParse(value).success;

/** 保存した値と今の値とで、書き換えで送る値が違うか。 */
export const hasUnsavedChanges = (
  saved: ImageText,
  current: ImageText,
): boolean =>
  imageTextFields.some(
    (name) => toNullable(saved[name]) !== toNullable(current[name]),
  );
