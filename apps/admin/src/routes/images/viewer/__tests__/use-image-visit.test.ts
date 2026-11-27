import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import { useImageVisit } from "../use-image-visit";

import { createTestApp } from "@/testing/create-test-app";
import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";
import { withAppProviders } from "@/testing/hook-wrappers";
import { SAMPLE_IMAGES } from "@/testing/sample-photos";

afterEach(cleanup);

test("途中の写真より先に次の写真を開くと、遅く届いた写真で表示を上書きしない", async () => {
  const server = createImageRoutes(SAMPLE_IMAGES);
  const [first, second, third] = server.images();

  if (first === undefined || second === undefined || third === undefined) {
    throw new Error("画像が3枚必要です");
  }

  const app = createTestApp({ path: "/", routes: server.routes });
  await app.router.load();

  const { result, rerender } = renderHook((id: string) => useImageVisit(id), {
    initialProps: first.id,
    wrapper: withAppProviders(app),
  });

  await waitFor(() => {
    expect(result.current.shown?.id).toBe(first.id);
  });
  rerender(second.id);
  await waitFor(() => {
    expect(result.current.pending?.id).toBe(second.id);
  });
  const finishSecond = result.current.settle;
  rerender(third.id);
  await waitFor(() => {
    expect(result.current.pending?.id).toBe(third.id);
  });
  expect(result.current.shown?.id).toBe(first.id);
  act(() => {
    result.current.settle(third.id);
    finishSecond(second.id);
  });
  expect(result.current.shown?.id).toBe(third.id);
  expect(result.current.pending).toBeUndefined();
});
