import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, mock, test } from "bun:test";

import { useUploadMetadata } from "../use-upload-metadata";

import type { PhotoUpload } from "@/features/images/upload/logic/photo-uploads";
import { imageQueryKey } from "@/queries/image-query";
import { IMAGES_QUERY_KEY } from "@/queries/images-query";
import { createTestApp } from "@/testing/create-test-app";
import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";
import { withAppProviders } from "@/testing/hook-wrappers";

afterEach(cleanup);

const setup = async () => {
  const server = createImageRoutes([{}, {}, {}]);
  const [first, second, third] = server.images();

  if (first === undefined || second === undefined || third === undefined) {
    throw new Error("画像がありません");
  }

  const updates: string[] = [];
  let fail = true;

  const app = createTestApp({
    path: "/images",
    routes: {
      ...server.routes,
      "admin/images/update": (input) => {
        updates.push(input.id);

        if (fail && input.id === second.id) {
          fail = false;

          return { error: "INTERNAL_SERVER_ERROR", defined: false } as const;
        }

        return server.routes["admin/images/update"](input);
      },
    },
  });

  await app.router.load();

  const { queryClient } = app;

  queryClient.setQueryDefaults(["admin", "images"], { gcTime: Infinity });
  queryClient.setQueryData(imageQueryKey(first.id), {
    _tag: "Succeeded",
    data: first,
  });
  queryClient.setQueryData(IMAGES_QUERY_KEY, {
    pageParams: [undefined],
    pages: [{ images: server.images(), nextCursor: null }],
  });

  const file = new File(["x"], "sea.jpg");

  const uploads: PhotoUpload[] = [
    { file, id: 1, status: "added", imageId: first.id },
    { file, id: 2, status: "added", imageId: second.id },
    { file, id: 3, status: "added", imageId: third.id },
    { file, id: 4, status: "failed" },
  ];

  const done = mock(() => undefined);

  const { result } = renderHook(
    () =>
      useUploadMetadata(uploads, { isActive: () => true, onComplete: done }),
    {
      wrapper: withAppProviders(app),
    },
  );

  return { first, second, result, updates, done, queryClient };
};

test("写真ごとの入力を残し、全ての欄が正しくなるまで保存しない", async () => {
  const { result, updates, done } = await setup();

  act(() => {
    result.current.change(1, { description: "浜辺" });
    result.current.change(2, { title: "あ".repeat(201) });
  });
  expect(result.current.isDirty()).toBe(true);
  act(() => {
    result.current.finish();
  });
  expect(result.current.error).toEqual({ id: 2, reason: "title" });
  expect(updates).toEqual([]);

  act(() => {
    result.current.change(1, { description: " " });
    result.current.change(2, { title: "" });
  });
  expect(result.current.isDirty()).toBe(false);
  act(() => {
    result.current.finish();
  });
  expect(done).toHaveBeenCalledTimes(1);
  expect(updates).toEqual([]);
});

test("追加できた写真の変更を保存し、途中で失敗したら入力を直して残りだけを送り直せる", async () => {
  const { first, second, result, updates, done, queryClient } = await setup();

  act(() => {
    result.current.change(1, { title: "海" });
    result.current.change(2, { description: "夕暮れ" });
    result.current.change(4, { title: "送れなかった写真" });
  });
  act(() => {
    result.current.finish();
    result.current.finish();
  });

  await waitFor(() => {
    expect(result.current.error).toEqual({ id: 2, reason: "failed" });
  });
  expect(result.current.draft(1).title).toBe("海");
  expect(result.current.draft(2).description).toBe("夕暮れ");
  expect(done).not.toHaveBeenCalled();
  expect(queryClient.getQueryData(imageQueryKey(first.id))).toMatchObject({
    data: { title: "海" },
  });
  expect(queryClient.getQueryData(IMAGES_QUERY_KEY)).toMatchObject({
    pages: [{ images: [{ title: "海" }, {}, {}] }],
  });

  act(() => {
    result.current.change(2, { description: "夜の海" });
  });
  act(() => {
    result.current.finish();
  });

  await waitFor(() => {
    expect(done).toHaveBeenCalledTimes(1);
  });
  expect(updates).toEqual([first.id, second.id, second.id]);
  expect(result.current.draft(1)).toEqual({ title: "", description: "" });
  expect(result.current.isDirty()).toBe(true);
  expect(result.current.draft(4).title).toBe("送れなかった写真");
});
