import { expect, test } from "bun:test";

import { createSeriesRoutes } from "../create-series-routes";

test("新しいシリーズは一覧の先頭に画像の無い非公開の状態で加わる", () => {
  const routes = createSeriesRoutes();
  routes["admin/series/create"]({
    name: "夏",
    slug: "summer",
    description: null,
  });
  expect(routes["admin/series/list"]().output.series[0]).toMatchObject({
    name: "夏",
    published: false,
    coverImage: null,
    imageCount: 0,
  });
});

test("カバーの画像を非公開にすると詳細に反映され、削除すると次の写真がカバーになる", () => {
  const routes = createSeriesRoutes();
  const [series] = routes["admin/series/list"]().output.series;
  const cover = series?.coverImage;

  if (!series || !cover) throw new Error("カバーがありません");

  routes["admin/images/unpublish"]({ id: cover.id });
  const detail = routes["admin/series/get"]({ id: series.id });

  if (!("output" in detail)) throw new Error("シリーズがありません");

  expect(detail.output.images[0]).toMatchObject({
    id: cover.id,
    published: false,
  });
  routes["admin/images/delete"]({ id: cover.id });
  const [updated] = routes["admin/series/list"]().output.series;
  expect(updated?.imageCount).toBe(series.imageCount - 1);
  expect(updated?.coverImage?.id).not.toBe(cover.id);
});
