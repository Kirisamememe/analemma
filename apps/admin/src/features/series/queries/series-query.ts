import type { ApiClient, ApiInputs, ApiOutputs } from "@/api/api-types";
import { callApi } from "@/api/call-api";

export const SERIES_LIST_KEY = ["admin", "series", "list"] as const;

/** シリーズを作るときに送る値。 */
export type SeriesFields = ApiInputs["admin"]["series"]["create"];

/** シリーズの詳細を取得するキー。 */
export const seriesKey = (id: string) =>
  ["admin", "series", "get", id] as const;

/** シリーズの編集の送信に使うキー。 */
export const seriesSaveKey = (id: string) =>
  ["admin", "series", "update", id] as const;

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

const loadSeries = (api: ApiClient, id: string) =>
  callApi(api.admin.series.get({ id }), ["NOT_FOUND"]);

/** 詳細の取得結果。 */
export type LoadedSeries = Awaited<ReturnType<typeof loadSeries>>;

const selectDetail = (result: LoadedSeries) => {
  if (result._tag === "Failed") return null;

  const { id, name, slug, description, published } = result.data;

  return { id, name, slug, description, published };
};

/** 詳細に表示するシリーズ。 */
export type Series = NonNullable<ReturnType<typeof selectDetail>>;

/** シリーズと画像の読み込み。 */
export const seriesDetailQuery = (api: ApiClient, id: string) => ({
  key: seriesKey(id),
  load: () => loadSeries(api, id),
  select: selectDetail,
});

/** シリーズの名前・slug・説明を保存する。 */
export const saveSeries = (
  api: ApiClient,
  fields: SeriesFields | ApiInputs["admin"]["series"]["update"],
) =>
  "id" in fields
    ? callApi(api.admin.series.update(fields), ["SLUG_TAKEN", "NOT_FOUND"])
    : callApi(api.admin.series.create(fields), ["SLUG_TAKEN"]);

type Action = "publish" | "unpublish" | "delete";
/** シリーズの公開状態の変更、または削除。 */
export type SeriesChange = Record<"action", Action>;

/** 操作を送り、取り直しが必要な失敗を返す。 */
export const changeSeries = async (
  api: ApiClient,
  change: SeriesChange & Record<"id", string>,
) => {
  const { id } = change;
  const service = api.admin.series;

  const result =
    change.action === "delete"
      ? await callApi(service.delete({ id }), ["NOT_FOUND"])
      : await callApi(service[change.action]({ id }), ["NOT_FOUND"]);

  return result._tag === "Failed" ? result.code : undefined;
};
