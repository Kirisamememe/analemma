import { describe, expect, test } from "bun:test";

import { deleteImage, saveImage, setPublication } from "../image-actions";

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
  test("無い画像は NotFound にする", async () => {
    const { api } = createFakeApi(createImageRoutes([]).routes);

    const result = await saveImage(api, {
      id: MISSING_ID,
      values: { title: "", description: "", alt: "" },
    });

    expect(result).toEqual({ _tag: "NotFound" });
  });
});

describe("setPublication", () => {
  test("非公開にしてから公開し、無い画像は NotFound にする", async () => {
    const { api, id } = setUp();

    expect(await setPublication(api, { id, published: false })).toMatchObject({
      _tag: "Unpublished",
      image: { published: false },
    });
    expect(await setPublication(api, { id, published: true })).toMatchObject({
      _tag: "Published",
      image: { published: true },
    });
    expect(
      await setPublication(api, { id: MISSING_ID, published: true }),
    ).toEqual({ _tag: "NotFound" });
  });
});

describe("deleteImage", () => {
  test("消して、もう無ければ NotFound にする", async () => {
    const { api, id, server } = setUp();

    expect(await deleteImage(api, id)).toEqual({ _tag: "Deleted" });
    expect(server.images()).toHaveLength(0);
    expect(await deleteImage(api, id)).toMatchObject({
      _tag: "NotFound",
      missing: { code: "NOT_FOUND" },
    });
  });
});
