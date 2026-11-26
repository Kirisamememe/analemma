import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import { useUploadDialog } from "../use-upload-dialog";

import { createTestApp } from "@/testing/create-test-app";
import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";
import { withAppProviders } from "@/testing/hook-wrappers";

afterEach(cleanup);

test("閉じても選んだ写真を保ち、別の写真に入力の誤りがあればその写真へ戻れる", async () => {
  const app = createTestApp({
    path: "/images",
    routes: createImageRoutes([]).routes,
  });

  await app.router.load();

  const { result } = renderHook(useUploadDialog, {
    wrapper: withAppProviders(app),
  });

  const photos = ["a.jpg", "b.jpg"].map(
    (name) => new File(["a"], name, { type: "image/jpeg" }),
  );

  act(() => {
    result.current.receive(photos);
  });
  expect(result.current.isOpen).toBe(true);
  expect(result.current.isUploading).toBe(true);
  await waitFor(() => {
    expect(result.current.isUploading).toBe(false);
    expect(result.current.canEditSelected).toBe(true);
  });
  act(() => {
    result.current.metadata.change(1, { title: "写".repeat(201) });
    result.current.select(2);
    result.current.setOpen(false);
  });
  act(() => {
    result.current.open();
  });
  expect(result.current.selected?.file.name).toBe("b.jpg");
  act(() => {
    result.current.metadata.finish();
  });
  expect(result.current.problem?.name).toBe("a.jpg");
  expect(result.current.problem?.message).toBe("imageDetail.invalidTitle");
  act(() => result.current.problem?.show?.());
  expect(result.current.selected?.file.name).toBe("a.jpg");
  expect(result.current.problem?.show).toBeUndefined();
  act(() => {
    result.current.metadata.change(1, { title: "海" });
  });
  act(() => {
    result.current.metadata.finish();
  });
  await waitFor(() => {
    expect(result.current.isOpen).toBe(false);
  });
  expect(result.current.selected).toBeUndefined();
});

test("完了で保存できた写真を閉じ、失敗した写真の原稿は開き直して送り直せる", async () => {
  const server = createImageRoutes();
  const ready = Promise.withResolvers<undefined>();
  let failed = false;

  const app = createTestApp({
    path: "/images",
    routes: {
      ...server.routes,
      "admin/images/upload": async (input) => {
        if (input.photo.name === "lost.jpg" && !failed) {
          failed = true;
          return { error: "INTERNAL_SERVER_ERROR", defined: false } as const;
        }

        if (input.photo.name === "wrong.bmp") await ready.promise;

        return server.routes["admin/images/upload"](input);
      },
    },
  });

  await app.router.load();

  const { result } = renderHook(useUploadDialog, {
    wrapper: withAppProviders(app),
  });

  act(() => {
    result.current.receive(
      ["saved.jpg", "lost.jpg", "wrong.bmp"].map(
        (name) => new File(["x"], name),
      ),
    );
    result.current.metadata.change(1, { title: "朝" });
    result.current.metadata.change(2, { description: "撮影メモ" });
    result.current.metadata.change(3, { title: "形式を確認する前の原稿" });
  });
  ready.resolve(undefined);
  await waitFor(() => {
    expect(result.current.isUploading).toBe(false);
  });
  act(() => {
    result.current.metadata.finish();
  });
  await waitFor(() => {
    expect(result.current.isOpen).toBe(false);
  });
  expect(server.images().map(({ title }) => title)).toEqual(["朝"]);
  expect(result.current.uploads.map(({ id }) => id)).toEqual([2, 3]);
  act(() => {
    result.current.open();
  });
  expect(result.current.metadata.draft(2).description).toBe("撮影メモ");
  act(() => {
    result.current.select(3);
  });
  expect(result.current.canEditSelected).toBe(true);
  expect(result.current.metadata.draft(3).title).toBe("形式を確認する前の原稿");
  act(() => {
    result.current.focus.retry(2);
  });
  await waitFor(() => {
    expect(result.current.isUploading).toBe(false);
  });
  act(() => {
    result.current.metadata.finish();
  });
  await waitFor(() => {
    expect(result.current.isOpen).toBe(false);
  });
  expect(server.images().map(({ description }) => description)).toEqual([
    "撮影メモ",
    null,
  ]);
  expect(result.current.uploads.map(({ id }) => id)).toEqual([3]);
  act(() => {
    app.history.push("/pages");
  });
  await waitFor(() => {
    expect(result.current.leaving._tag).toBe("Asking");
  });
});
