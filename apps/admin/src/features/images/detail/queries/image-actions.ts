import { type ImageText, toUpdateInput } from "../logic/image-text";

import type { ApiClient, ApiOutputs } from "@/api/api-types";
import { callApi } from "@/api/call-api";

type Image = ApiOutputs["admin"]["images"]["get"];

/** 画像を書き換えた結果。 */
export type SaveImageResult =
  | {
      /** どの結果か。 */
      readonly _tag: "Saved";
      /** 書き換えた後の画像。 */
      readonly image: Image;
    }
  | {
      /** どの結果か。 */
      readonly _tag: "NotFound";
    };

/** 書き換える画像と、フォームの値。 */
export type ImageTextChange = {
  /** 画像の ID。 */
  readonly id: string;
  /** フォームの値。 */
  readonly values: ImageText;
};

/** 画像のタイトル・説明・alt を、フォームの値で書き換える。 */
export const saveImage = async (
  api: ApiClient,
  { id, values }: ImageTextChange,
): Promise<SaveImageResult> => {
  const result = await callApi(
    api.admin.images.update({ id, ...toUpdateInput(values) }),
    ["NOT_FOUND"],
  );

  return result._tag === "Succeeded"
    ? { _tag: "Saved", image: result.data }
    : { _tag: "NotFound" };
};
