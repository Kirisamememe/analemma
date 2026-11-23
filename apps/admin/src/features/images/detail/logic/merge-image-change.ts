import type { AdminImage } from "../queries/image-query";

/** その操作が変えた欄と更新日時を、手元にある最新の画像に反映する。 */
export const mergeImageChange =
  (result: AdminImage, kind: "text" | "publication") =>
  (current: AdminImage): AdminImage => {
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
