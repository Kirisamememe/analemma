import type { ApiClient, ApiOutputs } from "@/api/api-types";

export const SERIES_LIST_KEY = ["admin", "series", "list"] as const;

const selectList = (data: ApiOutputs["admin"]["series"]["list"]) =>
  data.series.map(({ id, name, published, imageCount, coverImage }) => ({
    id,
    name,
    published,
    imageCount,
    alt: coverImage?.alt,
    src: coverImage?.deliveryImages[0]?.url,
  }));

/** 一覧の読み込み。 */
export const seriesListQuery = (api: ApiClient) => ({
  key: SERIES_LIST_KEY,
  load: () => api.admin.series.list(),
  select: selectList,
});
