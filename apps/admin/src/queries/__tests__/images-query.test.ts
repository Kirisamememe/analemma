import { ORPCError } from "@orpc/client";
import { describe, expect, test } from "bun:test";

import {
  findNextConverting,
  loadImagesPage,
  prependImage,
  settleListedImage,
} from "../images-query";

import { createFakeApi } from "@/testing/create-fake-api";
import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";

describe("loadImagesPage", () => {
  test("cursor を省くと最初のページを、渡すとその続きを読む", async () => {
    const server = createImageRoutes(
      Array.from({ length: 51 }, (_, index) => ({
        title: `写真 ${index + 1}`,
      })),
    );

    const { api } = createFakeApi(server.routes);
    const first = await loadImagesPage(api, undefined);

    expect(first.images).toHaveLength(50);
    expect(first.nextCursor).not.toBeNull();

    const rest = await loadImagesPage(api, first.nextCursor ?? undefined);

    expect(rest.images.map(({ title }) => title)).toEqual(["写真 51"]);
    expect(rest.nextCursor).toBeNull();
  });
});

describe("prependImage", () => {
  test("最初のページに、新しく足した順を保って足し、読んである画像は動かさない", async () => {
    const server = createImageRoutes([{ title: "前から" }]);
    const { api } = createFakeApi(server.routes);

    const older = await api.admin.images.upload({
      photo: new File(["x"], "older.jpg", { type: "image/jpeg" }),
    });

    const newer = await api.admin.images.upload({
      photo: new File(["x"], "newer.jpg", { type: "image/jpeg" }),
    });

    const page = await loadImagesPage(api, undefined);

    const withoutOlder = {
      ...page,
      images: page.images.filter(({ id }) => id !== older.id),
    };

    expect(prependImage(older)(page, 0)).toBe(page);
    expect(
      prependImage(older)(withoutOlder, 0).images.map(({ id }) => id),
    ).toEqual(page.images.map(({ id }) => id));
    expect(prependImage(newer)(page, 1)).toBe(page);
  });
});

const listed = (id: string, status: "processing" | "published") => ({
  id,
  status,
});

describe("findNextConverting", () => {
  test("ページをまたいで、いちばん先に受け取った変換中の画像の ID を返す", () => {
    const pages = [
      { images: [listed("5", "processing"), listed("4", "published")] },
      { images: [listed("3", "processing"), listed("2", "processing")] },
    ];

    expect(findNextConverting(pages)).toBe("2");
  });

  test("変換中の画像が無ければ null を返す", () => {
    expect(findNextConverting([{ images: [listed("1", "published")] }])).toBe(
      null,
    );
    expect(findNextConverting([])).toBe(null);
  });
});

const listedImages = () => {
  const server = createImageRoutes([
    { title: "保存したタイトル", status: "processing" },
    { title: "港" },
  ]);

  const [converting, harbor] = server.images();

  if (converting === undefined || harbor === undefined) {
    throw new Error("画像が2枚必要です");
  }

  const page = { images: [converting, harbor], nextCursor: null };

  return { converting, harbor, page };
};

describe("settleListedImage", () => {
  test("変換中のままなら、一覧を書き換えない", () => {
    const { converting } = listedImages();

    expect(
      settleListedImage(converting.id, { _tag: "Succeeded", data: converting }),
    ).toBeUndefined();
  });

  test("変換を終えていたら、その画像の状態と配信用の画像だけを差し替え、一覧にあるタイトルを保つ", () => {
    const { converting, harbor, page } = listedImages();

    const settle = settleListedImage(converting.id, {
      _tag: "Succeeded",
      data: {
        ...converting,
        title: null,
        status: "published",
        publishedAt: harbor.publishedAt,
        deliveryImages: [{ width: 640, height: 480, url: "/media/a/640.avif" }],
      },
    });

    const settled = settle?.(page);

    expect(settled?.images[0]).toMatchObject({
      title: "保存したタイトル",
      status: "published",
      deliveryImages: [{ width: 640 }],
    });
    expect(settled?.images[1]).toBe(harbor);
  });

  test("画像が無くなっていたら、一覧から外す", () => {
    const { converting, harbor, page } = listedImages();

    const settle = settleListedImage(converting.id, {
      _tag: "Failed",
      code: "NOT_FOUND",
      error: new ORPCError("NOT_FOUND"),
    });

    expect(settle?.(page).images).toEqual([harbor]);
  });
});
