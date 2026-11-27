import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import type { ApiOutputs } from "@/api/api-types";
import { useConversionWatch } from "@/components/images/hooks/use-conversion-watch";
import { IMAGES_QUERY_KEY } from "@/queries/images-query";
import { createTestApp } from "@/testing/create-test-app";
import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";
import { withAppProviders } from "@/testing/hook-wrappers";

afterEach(cleanup);

const POLL_MS = 20;

type ImagesPage = ApiOutputs["admin"]["images"]["list"];

const setUp = async (seeds: Parameters<typeof createImageRoutes>[0]) => {
  const server = createImageRoutes(seeds);
  const app = createTestApp({ path: "/", routes: server.routes });

  await app.router.load();
  app.queryClient.setQueryDefaults(IMAGES_QUERY_KEY, { gcTime: Infinity });
  app.queryClient.setQueryData(IMAGES_QUERY_KEY, {
    pageParams: [undefined],
    pages: [{ images: server.images(), nextCursor: null }],
  });

  const pages = () => [{ images: [...server.images()], nextCursor: null }];
  const gets = () => app.calls.filter((path) => path === "admin/images/get");

  const listed = () =>
    app.queryClient.getQueryData<Record<"pages", ImagesPage[]>>(
      IMAGES_QUERY_KEY,
    )?.pages[0]?.images ?? [];

  return { server, app, pages, gets, listed };
};

test("変換中の画像が無ければ、何も取り直さない", async () => {
  const { app, pages, gets } = await setUp([{ title: "港" }]);

  renderHook(
    () => {
      useConversionWatch(pages(), POLL_MS);
    },
    {
      wrapper: withAppProviders(app),
    },
  );
  await Bun.sleep(POLL_MS * 4);

  expect(gets()).toEqual([]);
});

test("いちばん先に受け取った変換中の画像だけを取り直し、変換を終えたら一覧のその画像だけを差し替える", async () => {
  const { server, app, pages, gets, listed } = await setUp([
    { title: "後", status: "processing" },
    { title: "先", status: "processing" },
    { title: "港" },
  ]);

  const [later, earlier, harbor] = server.images();
  const before = listed();

  const { rerender } = renderHook(
    (current: ReturnType<typeof pages>) => {
      useConversionWatch(current, POLL_MS);
    },
    { initialProps: pages(), wrapper: withAppProviders(app) },
  );

  await waitFor(() => {
    expect(gets().length).toBeGreaterThan(1);
  });
  expect(listed()).toBe(before);

  server.convert(earlier?.id ?? "", { status: "published" });
  await waitFor(() => {
    expect(listed().map(({ status }) => status)).toEqual([
      "processing",
      "published",
      "published",
    ]);
  });
  expect(listed()[0]).toBe(before[0]);
  expect(listed()[2]).toBe(before[2]);
  expect(later?.id).not.toBe(harbor?.id);

  const settled = gets().length;

  rerender([{ images: [...server.images()].slice(1), nextCursor: null }]);
  await Bun.sleep(POLL_MS * 4);
  expect(gets()).toHaveLength(settled);
});
