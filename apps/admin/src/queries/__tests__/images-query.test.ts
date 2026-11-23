import { describe, expect, test } from "bun:test";

import { loadImagesPage } from "../images-query";

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
