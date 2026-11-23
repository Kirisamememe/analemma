import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import { useSeriesDetail } from "../../hooks/use-series-detail";
import { useSeriesForm } from "../../hooks/use-series-form";

import { createTestApp } from "@/testing/create-test-app";
import {
  createSeriesRoutes,
  SAMPLE_SERIES_ID,
} from "@/testing/fake-routes/create-series-routes";
import { withAppProviders } from "@/testing/hook-wrappers";

afterEach(cleanup);

test("シリーズの名前を保存中に公開を求めると、保存が済んだ後に公開を送る", async () => {
  const series = {
    id: SAMPLE_SERIES_ID,
    name: "旅の写真",
    slug: "travel",
    description: null,
  };

  const routes = createSeriesRoutes();
  const reply = Promise.withResolvers<undefined>();

  const app = createTestApp({
    path: "/enroll",
    routes: {
      ...routes,
      "admin/series/update": async (input) => {
        await reply.promise;
        return routes["admin/series/update"](input);
      },
    },
  });

  await app.router.load();

  const { result } = renderHook(
    () => ({
      editor: useSeriesForm({ series, onClose: () => undefined }),
      detail: useSeriesDetail(series, () => undefined),
    }),
    { wrapper: withAppProviders(app) },
  );

  await act(async () => {
    result.current.editor.form.setFieldValue("name", "冬の旅");
    await result.current.editor.form.handleSubmit();
  });
  await waitFor(() => {
    expect(app.calls).toContain("admin/series/update");
  });

  act(() => {
    result.current.detail.change({ action: "publish" });
  });
  await waitFor(() => {
    expect(result.current.detail.isPending).toBe(true);
  });
  expect(app.calls).not.toContain("admin/series/publish");

  reply.resolve(undefined);
  await waitFor(() => {
    expect(app.calls).toContain("admin/series/publish");
    expect(result.current.detail.isPending).toBe(false);
  });
});
