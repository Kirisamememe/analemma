import type { ApiClient, ApiInputs, ApiOutputs } from "@/api/api-types";
import { callApi } from "@/api/call-api";

export const SERIES_LIST_KEY = ["admin", "series", "list"] as const;

/** シリーズを作るときに送る値。 */
export type SeriesFields = ApiInputs["admin"]["series"]["create"];

/** シリーズを非公開の状態で作る。 */
export const saveSeries = (api: ApiClient, fields: SeriesFields) =>
  callApi(api.admin.series.create(fields), ["SLUG_TAKEN"]);

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
