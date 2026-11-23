import { type ImageText, toUpdateInput } from "../logic/image-text";

import type { ApiClient } from "@/api/api-types";
import { callApi } from "@/api/call-api";

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
) => {
  const result = await callApi(
    api.admin.images.update({ id, ...toUpdateInput(values) }),
    ["NOT_FOUND"],
  );

  return result._tag === "Succeeded"
    ? ({ _tag: "Saved", image: result.data } as const)
    : ({ _tag: "NotFound" } as const);
};
