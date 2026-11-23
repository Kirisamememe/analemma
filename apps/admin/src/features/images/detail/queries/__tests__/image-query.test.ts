import { describe, expect, test } from "bun:test";

import { loadImage, loadImageNeighbors } from "../image-query";

import { createFakeApi } from "@/testing/create-fake-api";
import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";

describe("loadImage", () => {
  test("画像を読み、無ければ NOT_FOUND の結果を返す", async () => {
    const server = createImageRoutes([{ title: "夕暮れ" }]);
    const { api } = createFakeApi(server.routes);
    const [image] = server.images();

    if (image === undefined) throw new Error("画像がありません");

    expect(await loadImage(api, image.id)).toEqual({
      _tag: "Succeeded",
      data: image,
    });
    expect(
      await loadImage(api, "019b0000-0000-7000-8000-0000000000ff"),
    ).toMatchObject({ _tag: "Failed", code: "NOT_FOUND" });
  });
});

describe("loadImageNeighbors", () => {
  test("前後の画像の ID を読み、無い画像なら NOT_FOUND の結果を返す", async () => {
    const server = createImageRoutes([{ title: "新" }, { title: "古" }]);
    const { api } = createFakeApi(server.routes);
    const [newer = "", older = ""] = server.images().map(({ id }) => id);

    expect(await loadImageNeighbors(api, older)).toEqual({
      _tag: "Succeeded",
      data: { newer, older: null },
    });
    expect(
      await loadImageNeighbors(api, "019b0000-0000-7000-8000-0000000000ff"),
    ).toMatchObject({ _tag: "Failed", code: "NOT_FOUND" });
  });
});
