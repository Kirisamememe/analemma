import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { useImageNeighbors } from "@/features/images/detail/hooks/use-image-neighbors";
import { createTestApp } from "@/testing/create-test-app";
import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";
import { withAppProviders } from "@/testing/hook-wrappers";

afterEach(cleanup);

const setUp = async () => {
  const server = createImageRoutes([
    { title: "1" },
    { title: "2" },
    { title: "3" },
  ]);

  const app = createTestApp({ path: "/images", routes: server.routes });

  await app.router.load();

  return { app, ids: server.images().map(({ id }) => id) };
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
  });

  test("無い画像では、前も次も無いことを返す", async () => {
    const { app } = await setUp();

    const { result } = renderHook(
      () => useImageNeighbors("019b0000-0000-7000-8000-0000000000ff"),
      { wrapper: withAppProviders(app) },
    );

    await waitFor(() => {
      expect(app.calls).toContain("admin/images/neighbors");
    });
    expect(result.current).toEqual({ previous: undefined, next: undefined });
  });
});
