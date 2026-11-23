import { expect, test } from "bun:test";

import { saveSeries, seriesListQuery } from "../series-query";

import { createFakeApi } from "@/testing/create-fake-api";
import { createSeriesRoutes } from "@/testing/fake-routes/create-series-routes";

test("別のシリーズが使っている slug を知らせる", async () => {
  const { api } = createFakeApi(createSeriesRoutes());
  expect(
    await saveSeries(api, { slug: "travel", name: "記録", description: null }),
  ).toMatchObject({ _tag: "Failed", code: "SLUG_TAKEN" });
});

test("一覧にはカバーのサムネイルと表示する項目を取り出す", async () => {
  const { api } = createFakeApi(createSeriesRoutes());
  const query = seriesListQuery(api);
  const rows = query.select(await query.load());
  expect(rows[0]).toMatchObject({
    name: "旅の写真",
    published: false,
    imageCount: 3,
  });
  expect(rows[0]?.src).toContain("dusk-ridge");
});
