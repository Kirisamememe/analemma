import { describe, expect, test } from "bun:test";

import { saveImage } from "../image-actions";

import { createFakeApi } from "@/testing/create-fake-api";
import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";

const MISSING_ID = "019b0000-0000-7000-8000-0000000000ff";

const setUp = () => {
  const server = createImageRoutes([{ title: "夕暮れ", alt: "山並み" }]);
  const [image] = server.images();

  if (image === undefined) throw new Error("画像がありません");

  return { server, id: image.id, api: createFakeApi(server.routes).api };
};

describe("saveImage", () => {
  test("フォームの値で書き換え、空の欄は消す", async () => {
    const { api, id } = setUp();

    const result = await saveImage(api, {
      id,
      values: { title: " 夕暮れの稜線 ", description: "峠から見た。", alt: "" },
    });

    expect(result).toMatchObject({
      _tag: "Saved",
      image: { title: "夕暮れの稜線", description: "峠から見た。", alt: null },
    });
  });

  test("無い画像は NotFound にする", async () => {
    const { api } = setUp();

    expect(
      await saveImage(api, {
        id: MISSING_ID,
        values: { title: "", description: "", alt: "" },
      }),
    ).toEqual({ _tag: "NotFound" });
  });
});
