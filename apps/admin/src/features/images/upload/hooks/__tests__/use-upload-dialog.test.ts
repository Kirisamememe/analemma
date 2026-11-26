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
