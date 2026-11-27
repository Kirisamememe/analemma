import { describe, expect, test } from "bun:test";

import {
  findNextConverting,
  loadImagesPage,
  prependImage,
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
