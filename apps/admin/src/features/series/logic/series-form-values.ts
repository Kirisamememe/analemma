import {
  fixedPageSlug,
  imageDescription,
  imageTitle,
} from "@analemma/contract";

import type { SeriesFields } from "../queries/series-query";

import type { MessageKey } from "@/i18n/use-translate";

const SCHEMAS = {
  name: imageTitle,
  slug: fixedPageSlug,
  description: imageDescription,
};

const ERRORS = {
  name: "series.invalidName",
  slug: "fixedPageEditor.invalidSlug",
  description: "imageDetail.invalidDescription",
} as const;

/** シリーズの入力欄に出す検証結果。 */
export const checkSeriesField = (
  field: keyof SeriesFields,
  value: string,
): MessageKey | undefined => {
  if (field === "description" && value.trim() === "") return undefined;

  return SCHEMAS[field].safeParse(value).success ? undefined : ERRORS[field];
};

/** シリーズの入力値を保存する形に変える。 */
export const seriesSaveFields = (
  values: Record<keyof SeriesFields, string>,
): SeriesFields => ({
  ...values,
  description: values.description.trim() || null,
});
