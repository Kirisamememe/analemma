import type { ApiClient } from "@/api/api-types";
import { callApi } from "@/api/call-api";

type Action = "publish" | "unpublish" | "delete";
type Membership = "addImages" | "removeImages" | "reorder";
/** シリーズの公開状態・画像の並びの変更、または削除。 */
export type SeriesChange =
  | { /** シリーズへの操作。 */ action: Action }
  | {
      /** 画像の並びへの操作。 */
      action: Membership;
      /** 操作の対象になる画像の ID。 */
      imageIds: readonly string[];
    };

/** 操作を送り、取り直しが必要な失敗を返す。 */
export const changeSeries = async (
  api: ApiClient,
  change: SeriesChange & Record<"id", string>,
) => {
  const { id } = change;
  const service = api.admin.series;

  if ("imageIds" in change) {
    const input = { id, imageIds: [...change.imageIds] };

    const result =
      change.action === "reorder"
        ? await callApi(service.reorder(input), ["ORDER_MISMATCH", "NOT_FOUND"])
        : await callApi(service[change.action](input), ["NOT_FOUND"]);

    return result._tag === "Failed" ? result.code : undefined;
  }

  const result =
    change.action === "delete"
      ? await callApi(service.delete({ id }), ["NOT_FOUND"])
      : await callApi(service[change.action]({ id }), ["NOT_FOUND"]);

  return result._tag === "Failed" ? result.code : undefined;
};

/** 追加できなかった画像のうち、削除済みの ID を取得する。 */
export const missingSeriesImages = async (
  api: ApiClient,
  imageIds: readonly string[],
) => {
  const results = await Promise.all(
    imageIds.map(async (id) => {
      const image = await callApi(api.admin.images.get({ id }), ["NOT_FOUND"]);
      return image._tag === "Failed" ? [id] : [];
    }),
  );

  return new Set(results.flat());
};
