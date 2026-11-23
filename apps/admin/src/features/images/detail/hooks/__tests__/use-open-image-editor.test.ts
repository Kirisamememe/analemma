import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import { useOpenImageEditor } from "../use-open-image-editor";

import { createTestApp } from "@/testing/create-test-app";
import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";
import { withAppProviders } from "@/testing/hook-wrappers";

afterEach(cleanup);

test("開くと今の値を取得してから編集し、操作できなくなったら閉じる", async () => {
  const server = createImageRoutes([{ title: "港の灯り" }]);
  const id = server.images()[0]?.id ?? "";
  const app = createTestApp({ path: "/", routes: server.routes });
  await app.router.load();

  server.routes["admin/images/update"]({
    id,
    title: "別のタブで保存",
    description: null,
    alt: null,
  });

  const { result, rerender } = renderHook(
    (disabled: boolean) => useOpenImageEditor(id, disabled),
    { initialProps: false, wrapper: withAppProviders(app) },
  );

  act(() => {
    result.current.open();
  });
  await waitFor(() => {
    expect(result.current.editing?.title).toBe("別のタブで保存");
  });
  rerender(true);
  expect(result.current.editing).toBeUndefined();
  rerender(false);
  expect(result.current.editing).toBeUndefined();
});
