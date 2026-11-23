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

    if (kind === "publication") {
      return {
        ...current,
        published: result.published,
        publishedAt: result.publishedAt,
        updatedAt,
      };
    }

    return {
      ...current,
      title: result.title,
      description: result.description,
      alt: result.alt,
      updatedAt,
    };
  };
