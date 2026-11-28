import { describe, expect, test } from "bun:test";

import { loadImage, settleLoadedImage } from "../image-query";

import { createFakeApi } from "@/testing/create-fake-api";
import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";

const setUp = () => {
  const [image] = createImageRoutes([
    { title: "保存したタイトル", status: "processing" },
  ]).images();

  if (image === undefined) throw new Error("画像がありません");

  const converted = {
    ...image,
    title: null,
    status: "published" as const,
    publishedAt: "2026-01-01T00:00:00.000Z",
    deliveryImages: [{ width: 640, height: 480, url: "/media/a/640.avif" }],
  };

  return { image, converted };
};

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

describe("settleLoadedImage", () => {
  test("変換中のままなら、読み込んだ画像を書き換えない", () => {
    const { image } = setUp();

    expect(
      settleLoadedImage({ _tag: "Succeeded", data: image }),
    ).toBeUndefined();
  });

  test("変換を終えていたら、状態と配信用の画像だけを差し替え、読み込んだタイトルを保つ", () => {
    const { image, converted } = setUp();
    const settle = settleLoadedImage({ _tag: "Succeeded", data: converted });

    expect(settle?.({ _tag: "Succeeded", data: image })).toEqual({
      _tag: "Succeeded",
      data: { ...converted, title: "保存したタイトル" },
    });
  });

  test("読み込んだ画像が変換を終えていたら、取り直した結果で書き戻さない", () => {
    const { image, converted } = setUp();
    const current = { _tag: "Succeeded", data: converted } as const;

    const settle = settleLoadedImage({
      _tag: "Succeeded",
      data: { ...image, status: "unpublished" },
    });

    expect(settle?.(current)).toBe(current);
  });

  test("取り直した画像が無くなっていたら、読み込んだ画像を、無いという結果に替える", async () => {
    const { image } = setUp();
    const { api } = createFakeApi(createImageRoutes([]).routes);
    const missing = await loadImage(api, image.id);

    expect(
      settleLoadedImage(missing)?.({ _tag: "Succeeded", data: image }),
    ).toBe(missing);
  });
});
