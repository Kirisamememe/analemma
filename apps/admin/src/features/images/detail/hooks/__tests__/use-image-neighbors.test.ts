import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { useImageNeighbors } from "@/features/images/detail/hooks/use-image-neighbors";
import { createTestApp } from "@/testing/create-test-app";
import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";
import { withAppProviders } from "@/testing/hook-wrappers";

afterEach(cleanup);

const setUp = async () => {
  const server = createImageRoutes(["1", "2", "3"].map((title) => ({ title })));

  const app = createTestApp({ path: "/images", routes: server.routes });

  await app.router.load();

  return { app, server, ids: server.images().map(({ id }) => id) };
};

describe("useImageNeighbors", () => {
  test("新しく足した順で、前と次の画像の ID を返し、端では無いことを返す", async () => {
    const { app, ids } = await setUp();
    const [first, second, third] = ids;

    const { result, rerender } = renderHook(
      ({ id }: Record<"id", string>) => useImageNeighbors(id),
      { initialProps: { id: second ?? "" }, wrapper: withAppProviders(app) },
    );

    await waitFor(() => {
      expect(result.current).toEqual({ previous: first, next: third });
    });
    rerender({ id: first ?? "" });
    await waitFor(() => {
      expect(result.current).toEqual({ previous: undefined, next: second });
    });
    rerender({ id: "019b0000-0000-7000-8000-0000000000ff" });
    await waitFor(() => {
      expect(result.current).toEqual({ previous: undefined, next: undefined });
    });
  });

  test("前後の取得に失敗しても、その画像の前後を取り直せる", async () => {
    const {
      app,
      server,
      ids: [id = "", next],
    } = await setUp();

    app.queryClient.setDefaultOptions({ queries: { retry: false } });
    server.replyNext("admin/images/neighbors", () => ({
      error: "INTERNAL_SERVER_ERROR",
      defined: false,
    }));

    const { result } = renderHook(() => useImageNeighbors(id), {
      wrapper: withAppProviders(app),
    });

    await waitFor(() => {
      expect(result.current.failure).toBeDefined();
    });
    result.current.failure?.retry();
    await waitFor(() => {
      expect(result.current).toEqual({ previous: undefined, next });
    });
  });
});
