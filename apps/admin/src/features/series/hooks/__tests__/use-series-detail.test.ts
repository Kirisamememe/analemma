import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import { useSeriesDetail } from "../use-series-detail";

import { createTestApp } from "@/testing/create-test-app";
import {
  createSeriesRoutes,
  SAMPLE_SERIES_ID,
} from "@/testing/fake-routes/create-series-routes";
import { withAppProviders } from "@/testing/hook-wrappers";

afterEach(cleanup);

test("削除の応答までは確認を表示し、成功したときだけ一覧に戻す", async () => {
  const routes = createSeriesRoutes();
  const reply = Promise.withResolvers<undefined>();
  let deleted = 0;

  const app = createTestApp({
    path: "/enroll",
    routes: {
      ...routes,
      "admin/series/delete": async (input) => {
        await reply.promise;
        return routes["admin/series/delete"](input);
      },
    },
  });

  await app.router.load();

  const { result } = renderHook(
    () =>
      useSeriesDetail({ id: SAMPLE_SERIES_ID, name: "旅行" }, () => {
        deleted += 1;
      }),
    { wrapper: withAppProviders(app) },
  );

  act(() => {
    result.current.openDialog("delete");
    result.current.change({ action: "delete" });
  });
  await waitFor(() => {
    expect(result.current.isPending).toBe(true);
  });
  expect(result.current.dialog).toBe("delete");
  expect(deleted).toBe(0);
  reply.resolve(undefined);
  await waitFor(() => {
    expect(result.current.isPending).toBe(false);
  });
  expect(result.current.dialog).toBeUndefined();
  expect(deleted).toBe(1);
});
