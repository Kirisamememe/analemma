import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, mock, test } from "bun:test";

import { useEditImage } from "../use-edit-image";

import { createTestApp } from "@/testing/create-test-app";
import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";
import { withAppProviders } from "@/testing/hook-wrappers";

afterEach(cleanup);

const setUp = async () => {
  const server = createImageRoutes([{ title: "港" }]);
  const [image] = server.images();

  if (image === undefined) throw new Error("写真がありません");

  const app = createTestApp({ path: "/", routes: server.routes });

  await app.router.load();
  const onClose = mock((): void => undefined);

  const { result } = renderHook(() => useEditImage({ image, onClose }), {
    wrapper: withAppProviders(app),
  });

  return { result, onClose };
};

test("変更が無ければ、確かめずに閉じる", async () => {
  const { result, onClose } = await setUp();

  act(() => {
    result.current.requestClose();
  });

  expect(result.current.confirmation.isOpen).toBe(false);
  expect(onClose).toHaveBeenCalledTimes(1);
});

test("変更があれば、閉じる前に確かめを開き、編集を続けると閉じず、破棄すると閉じる", async () => {
  const { result, onClose } = await setUp();

  act(() => {
    result.current.form.setFieldValue("title", "夜の港");
  });
  act(() => {
    result.current.requestClose();
  });

  expect(result.current.confirmation).toEqual({
    isOpen: true,
    whileSaving: false,
  });
  expect(onClose).not.toHaveBeenCalled();

  act(() => {
    result.current.stay();
  });

  expect(result.current.confirmation.isOpen).toBe(false);
  expect(onClose).not.toHaveBeenCalled();

  act(() => {
    result.current.requestClose();
  });
  act(() => {
    result.current.discard();
  });

  expect(onClose).toHaveBeenCalledTimes(1);
});
