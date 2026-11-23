import { type ImageText, toUpdateInput } from "../logic/image-text";

import type { ApiClient, ApiOutputs } from "@/api/api-types";
import { callApi } from "@/api/call-api";

/** 公開状態を変えた結果。 */
export type PublicationResult =
  | {
      /** どの結果か。 */
      readonly _tag: "Published" | "Unpublished";
      /** 変えた後の画像。 */
      readonly image: ApiOutputs["admin"]["images"]["get"];
    }
  | {
      /** どの結果か。 */
      readonly _tag: "NotFound";
    };

/** 画像を削除した結果。 */
export type DeleteImageResult = {
  /** どの結果か。 */
  readonly _tag: "Deleted" | "NotFound";
};

/** 書き換える画像と、フォームの値。 */
export type ImageTextChange = {
  /** 画像の ID。 */
  readonly id: string;
  /** フォームの値。 */
  readonly values: ImageText;
};

/** 公開状態の変え方。 */
export type PublicationChange = {
  /** 画像の ID。 */
  readonly id: string;
  /** 公開するか(`false` なら非公開にする)。 */
  readonly published: boolean;
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

/** 画像を公開するか、非公開にする。 */
export const setPublication = async (
  api: ApiClient,
  { id, published }: PublicationChange,
): Promise<PublicationResult> => {
  const result = await callApi(
    published
      ? api.admin.images.publish({ id })
      : api.admin.images.unpublish({ id }),
    ["NOT_FOUND"],
  );

  if (result._tag === "Failed") return { _tag: "NotFound" };

  return {
    _tag: result.data.published ? "Published" : "Unpublished",
    image: result.data,
  };
};

/** 画像を削除する。 */
export const deleteImage = async (
  api: ApiClient,
  id: string,
): Promise<DeleteImageResult> => {
  const result = await callApi(api.admin.images.delete({ id }), ["NOT_FOUND"]);

  return { _tag: result._tag === "Succeeded" ? "Deleted" : "NotFound" };
};
