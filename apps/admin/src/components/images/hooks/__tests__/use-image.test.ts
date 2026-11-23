import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import { useImage } from "@/components/images/hooks/use-image";
import { createTestApp } from "@/testing/create-test-app";
import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";
import { withAppProviders } from "@/testing/hook-wrappers";

afterEach(cleanup);

test("上の帯と写真の欄が同じ画像を待っても、画像の取得は一度だけ送る", async () => {
  const server = createImageRoutes([{ title: "港の灯り" }]);
  const id = server.images()[0]?.id ?? "";
  const app = createTestApp({ path: "/", routes: server.routes });
  await app.router.load();

  const { result } = renderHook(() => [useImage(id), useImage(id)], {
    wrapper: withAppProviders(app),
  });

  await waitFor(() => {
    expect(result.current.map((query) => query._tag)).toEqual([
      "Loaded",
      "Loaded",
    ]);
  });
  expect(app.calls.filter((path) => path === "admin/images/get")).toHaveLength(
    1,
  );
});
