import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, mock, test } from "bun:test";

import { useDeleteImage } from "../use-delete-image";

import { createTestApp } from "@/testing/create-test-app";
import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";
import { withAppProviders } from "@/testing/hook-wrappers";

afterEach(cleanup);

const setUp = async () => {
  const server = createImageRoutes([{ title: "港の灯り" }]);
  const id = server.images()[0]?.id ?? "";
  const app = createTestApp({ path: "/", routes: server.routes });
  await app.router.load();
  const onDeleted = mock((_deleted: string) => undefined);

  const { result } = renderHook(
    () =>
      useDeleteImage({ id, name: "港の灯り", isDisabled: false, onDeleted }),
    { wrapper: withAppProviders(app) },
  );

  return { app, server, id, onDeleted, result };
};

test("確かめを開くまでは送らず、確かめてから削除して、削除した画像を知らせる", async () => {
  const { app, server, id, onDeleted, result } = await setUp();

  act(() => {
    result.current.remove();
  });
  expect(app.calls).not.toContain("admin/images/delete");
  act(() => {
    result.current.confirm();
  });
  act(() => {
    result.current.remove();
  });
  await waitFor(() => {
    expect(onDeleted).toHaveBeenCalledWith(id);
  });
  expect(server.images()).toHaveLength(0);
});

test("もう無い画像は、送り直させずに、確かめを閉じる", async () => {
  const { server, id, onDeleted, result } = await setUp();

  server.routes["admin/images/delete"]({ id });
  act(() => {
    result.current.confirm();
  });
  act(() => {
    result.current.remove();
  });
  await waitFor(() => {
    expect(result.current.isConfirming).toBe(false);
  });
  expect(result.current.isGone).toBe(true);
  expect(onDeleted).not.toHaveBeenCalled();
});
