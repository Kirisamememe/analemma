import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import { imageQueryKey, loadImage } from "../../queries/image-query";
import { useImageCache } from "../use-image-cache";

import { IMAGES_QUERY_KEY } from "@/features/images/queries/images-query";
import { createFakeApi } from "@/testing/create-fake-api";
import { createTestApp } from "@/testing/create-test-app";
import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";
import { withAppProviders } from "@/testing/hook-wrappers";

afterEach(cleanup);

const setUp = () => {
  const server = createImageRoutes([
    { title: "夕暮れの稜線", alt: "山並み" },
    { title: "港の灯り" },
  ]);

  const [first, second] = server.images();

  if (first === undefined || second === undefined) {
    throw new Error("画像が2枚必要です");
  }

  const app = createTestApp({ path: "/", routes: server.routes });

  app.queryClient.setQueryData(imageQueryKey(first.id), {
    _tag: "Succeeded",
    data: first,
  });
  app.queryClient.setQueryData(IMAGES_QUERY_KEY, {
    pages: [{ images: [first, second], nextCursor: null }],
    pageParams: [undefined],
  });

  const { result } = renderHook(useImageCache, {
    wrapper: withAppProviders(app),
  });

  return { app, server, first, second, cache: result };
};

test("書き換えの応答は、その操作が変えた欄だけを、詳細と一覧の同じ画像に当てる", async () => {
  const { app, first, second, cache } = setUp();

  await act(() =>
    cache.current.applyChange(
      { ...first, title: "稜線", published: false },
      "text",
    ),
  );

  expect(app.queryClient.getQueryData(imageQueryKey(first.id))).toEqual({
    _tag: "Succeeded",
    data: { ...first, title: "稜線" },
  });
  expect(app.queryClient.getQueryData(IMAGES_QUERY_KEY)).toEqual({
    pages: [
      { images: [{ ...first, title: "稜線" }, second], nextCursor: null },
    ],
    pageParams: [undefined],
  });
});

test("無くなった画像は一覧から外し、詳細は server の結果に替える", async () => {
  const { app, server, first, second, cache } = setUp();
  const { api } = createFakeApi(server.routes);

  server.routes["admin/images/delete"]({ id: first.id });
  const gone = await loadImage(api, first.id);

  if (gone._tag !== "Failed") throw new Error("無い画像の結果が要ります");

  await act(async () => {
    await cache.current.dropFromList(first.id);
    await cache.current.replaceImage(first.id, gone);
  });

  expect(app.queryClient.getQueryData(IMAGES_QUERY_KEY)).toEqual({
    pages: [{ images: [second], nextCursor: null }],
    pageParams: [undefined],
  });
  expect(app.queryClient.getQueryData(imageQueryKey(first.id))).toBe(gone);
});
