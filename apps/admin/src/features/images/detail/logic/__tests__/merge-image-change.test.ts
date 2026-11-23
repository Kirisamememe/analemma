import { expect, test } from "bun:test";

import { mergeImageChange } from "../merge-image-change";

import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";

test("公開と本文の応答が前後しても、双方の変更と新しい更新日時が残る", () => {
  const [original] = createImageRoutes([{ title: "夕暮れ" }]).images();

  if (original === undefined) throw new Error("画像がありません");

  const published = {
    ...original,
    published: true,
    publishedAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  const edited = {
    ...original,
    title: "雪道",
    alt: "雪の積もった小道",
    updatedAt: "2026-01-02T00:00:00.000Z",
  };

  const expected = {
    ...edited,
    published: published.published,
    publishedAt: published.publishedAt,
  };

  expect(mergeImageChange(published, "publication")(edited)).toEqual(expected);
  expect(mergeImageChange(edited, "text")(published)).toEqual(expected);
});
