import { expect, test } from "bun:test";

import { seriesListQuery } from "../series-query";

import { createFakeApi } from "@/testing/create-fake-api";
import { createSeriesRoutes } from "@/testing/fake-routes/create-series-routes";

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
