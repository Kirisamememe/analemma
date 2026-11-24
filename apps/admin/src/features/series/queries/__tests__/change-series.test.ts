import { expect, test } from "bun:test";

import { changeSeries } from "../change-series";

import { createFakeApi } from "@/testing/create-fake-api";
import {
  createSeriesRoutes,
  SAMPLE_SERIES_ID,
} from "@/testing/fake-routes/create-series-routes";
test("シリーズの画像が足りない並び順は保存しない", async () => {
  const { api } = createFakeApi(createSeriesRoutes());
  expect(
    await changeSeries(api, {
      id: SAMPLE_SERIES_ID,
      action: "reorder",
      imageIds: [],
    }),
  ).toBe("ORDER_MISMATCH");
  expect(
    (await api.admin.series.get({ id: SAMPLE_SERIES_ID })).images,
  ).toHaveLength(3);
});
