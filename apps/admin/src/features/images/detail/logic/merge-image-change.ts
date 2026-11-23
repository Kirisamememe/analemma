import type { ApiOutputs } from "@/api/api-types";

type Image = ApiOutputs["admin"]["images"]["get"];

/** その操作が変えた欄と更新日時を、手元にある最新の画像に反映する。 */
export const mergeImageChange =
  (result: Image, kind: "text" | "publication") =>
  (current: Image): Image => {
    const updatedAt =
      current.updatedAt > result.updatedAt
        ? current.updatedAt
        : result.updatedAt;

    const { published, publishedAt, title, description, alt } = result;

    const change =
      kind === "publication"
        ? { published, publishedAt }
        : { title, description, alt };

    return { ...current, ...change, updatedAt };
  };
