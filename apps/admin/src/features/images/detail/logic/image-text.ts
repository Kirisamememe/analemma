import { imageAlt, imageDescription, imageTitle } from "@analemma/contract";

import type { ApiInputs, ApiOutputs } from "@/api/api-types";

type Image = ApiOutputs["admin"]["images"]["get"];

/** 画像のフォームで書き換える、タイトル・説明・alt の入力。 */
export type ImageText = Record<"title" | "description" | "alt", string>;

/** 画像のフォームの欄の名前。 */
export type ImageTextName = keyof ImageText;

const SCHEMAS = {
  title: imageTitle,
  description: imageDescription,
  alt: imageAlt,
};

const toNullable = (value: string): string | null => {
  const text = value.trim();

  return text === "" ? null : text;
};

/** 画像のタイトル・説明・alt から、フォームの最初の値を作る(無ければ空の欄)。 */
export const toImageText = ({
  title,
  description,
  alt,
}: Pick<Image, ImageTextName>): ImageText => ({
  title: title ?? "",
  description: description ?? "",
  alt: alt ?? "",
});

/** フォームの値から、書き換えで送る値を作る(前後の空白を落とし、空の欄は null)。 */
export const toUpdateInput = (
  values: ImageText,
): Omit<ApiInputs["admin"]["images"]["update"], "id"> => ({
  title: toNullable(values.title),
  description: toNullable(values.description),
  alt: toNullable(values.alt),
});

/** 欄の値が、空にするか、server が受け付ける値か。 */
export const isValidImageText = (name: ImageTextName, value: string): boolean =>
  toNullable(value) === null || SCHEMAS[name].safeParse(value).success;

/** 比べるフォームの値。 */
type Comparison = {
  /** 開いたときか、最後に保存できたときの値。 */
  readonly saved: ImageText;
  /** 今の値。 */
  readonly current: ImageText;
};

/** 保存した値と今の値とで、書き換えで送る値が違うか。 */
export const hasUnsavedChanges = ({ saved, current }: Comparison): boolean => {
  const before = toUpdateInput(saved);
  const after = toUpdateInput(current);

  return (
    before.title !== after.title ||
    before.description !== after.description ||
    before.alt !== after.alt
  );
};
