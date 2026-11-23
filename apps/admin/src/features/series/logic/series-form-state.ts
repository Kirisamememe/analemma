import type {
  LoadedSeries,
  saveSeries,
  SeriesFields,
} from "../queries/series-query";

type SaveFailure = Extract<
  Awaited<ReturnType<typeof saveSeries>>,
  Record<"_tag", "Failed">
>;

/** フォームを離れるときに確かめる内容。 */
export const seriesFormExit = (changed: boolean, saving: boolean) => {
  if (saving) {
    return {
      ask: true,
      title: "series.saving",
      description: "imageDetail.savingWillContinue",
      stay: "imageDetail.waitForSave",
      leave: "imageDetail.leaveDuringSave",
      tone: "secondary",
    } as const;
  }

  return {
    ask: changed,
    title: "imageDetail.discardTitle",
    description: "imageDetail.discardDescription",
    stay: "imageDetail.continueEditing",
    leave: "imageDetail.discard",
    tone: "danger",
  } as const;
};

/** 保存を受け付けなかった理由と、入力を直す slug。 */
export const seriesSaveFailure = (code: SaveFailure["code"], slug: string) =>
  code === "SLUG_TAKEN"
    ? ({ message: "series.saveFailed", refusedSlug: slug } as const)
    : ({ message: "series.gone" } as const);

/** 保存した入力欄の値を、取得済みのシリーズに反映する。 */
export const mergeSavedSeries =
  ({ name, slug, description }: SeriesFields) =>
  (current: LoadedSeries): LoadedSeries =>
    current._tag === "Succeeded"
      ? { ...current, data: { ...current.data, name, slug, description } }
      : current;
