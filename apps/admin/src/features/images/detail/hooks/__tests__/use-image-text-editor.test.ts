import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, mock, test } from "bun:test";

import { imageQueryKey } from "../../queries/image-query";
import { useImageTextEditor } from "../use-image-text-editor";
import { useViewerImage } from "../use-viewer-image";

import { createTestApp } from "@/testing/create-test-app";
import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";
import { withAppProviders } from "@/testing/hook-wrappers";

afterEach(cleanup);

const setUp = async () => {
  const server = createImageRoutes([{ title: "港の灯り" }]);
  const [image] = server.images();

  if (image === undefined) throw new Error("画像が必要です");

  const app = createTestApp({ path: "/", routes: server.routes });
  await app.router.load();
  app.queryClient.setQueryData(imageQueryKey(image.id), {
    _tag: "Succeeded",
    data: image,
  });

  const onClose = mock(() => undefined);

  const { result } = renderHook(
    () => ({
      editor: useImageTextEditor(image, onClose),
      shown: useViewerImage(image.id),
    }),
    { wrapper: withAppProviders(app) },
  );

  return { image, onClose, result };
};

test("変更が無ければすぐに閉じ、変更があれば、捨ててよいかを確かめる", async () => {
  const { onClose, result } = await setUp();

  act(() => {
    result.current.editor.requestClose();
  });
  expect(onClose).toHaveBeenCalledTimes(1);
  act(() => {
    result.current.editor.form.setFieldValue("title", "港");
  });
  act(() => {
    result.current.editor.requestClose();
  });
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(result.current.editor.confirmation).toMatchObject({
    isOpen: true,
    whileSaving: false,
    messages: { leave: "imageDetail.discard" },
  });
  act(() => {
    result.current.editor.leave();
  });
  expect(onClose).toHaveBeenCalledTimes(2);
});

test("保存すると、詳細の値を応答で差し替えてから閉じる", async () => {
  const { onClose, result } = await setUp();

  act(() => {
    result.current.editor.form.setFieldValue("title", " 港 ");
  });
  await act(() => result.current.editor.form.handleSubmit());
  await waitFor(() => {
    expect(onClose).toHaveBeenCalled();
  });
  expect(result.current.shown).toMatchObject({
    _tag: "Loaded",
    data: { data: { title: "港" } },
  });
});
