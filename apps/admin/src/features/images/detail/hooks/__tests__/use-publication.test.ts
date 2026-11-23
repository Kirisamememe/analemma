import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import { imageQueryKey } from "../../queries/image-query";
import { usePublication } from "../use-publication";

import { createTestApp } from "@/testing/create-test-app";
import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";
import { withAppProviders } from "@/testing/hook-wrappers";

afterEach(cleanup);

const setUp = async (published: boolean) => {
  const server = createImageRoutes([{ title: "港の灯り", published }]);
  const [image] = server.images();

  if (image === undefined) throw new Error("画像が必要です");

  const app = createTestApp({ path: "/", routes: server.routes });
  await app.router.load();

  app.queryClient.setQueryData(imageQueryKey(image.id), {
    _tag: "Succeeded",
    data: image,
  });

  const { result } = renderHook(() => usePublication(image, false), {
    wrapper: withAppProviders(app),
  });

  return { app, server, image, result };
};

test("非公開の画像は、確かめずにその場で公開し、詳細の公開状態を替える", async () => {
  const { app, image, result } = await setUp(false);

  act(() => {
    result.current.toggle();
  });
  expect(result.current.isConfirming).toBe(false);
  await waitFor(() => {
    expect(app.queryClient.getQueryData(imageQueryKey(image.id))).toMatchObject(
      { data: { published: true } },
    );
  });
});

test("公開している画像は、確かめを開き、確かめてから非公開を送る", async () => {
  const { app, server, result } = await setUp(true);

  act(() => {
    result.current.toggle();
  });
  expect(result.current.isConfirming).toBe(true);
  expect(app.calls).not.toContain("admin/images/unpublish");
  act(() => {
    result.current.unpublish();
  });
  await waitFor(() => {
    expect(result.current.isConfirming).toBe(false);
  });
  expect(server.images()[0]?.published).toBe(false);
});
