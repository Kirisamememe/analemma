import type { Series } from "../queries/series-query";

import { formatLocalDate } from "@/i18n/format-date-time";
import type { Locale } from "@/i18n/locales";
import type { useTranslate } from "@/i18n/use-translate";

type LabelOptions = {
  /** シリーズ内の位置。 */
  position: number;
  /** 日付の言語。 */
  locale: Locale;
  /** 行の名前の訳。 */
  t: ReturnType<typeof useTranslate>;
};

/** シリーズ内の画像と、その画像に対する操作の名前。 */
export const seriesImageLabel = (
  image: Pick<Series["images"][number], "title" | "alt" | "takenAt">,
  { position, locale, t }: LabelOptions,
): string =>
  image.title ??
  image.alt ??
  (image.takenAt === null
    ? t("series.untitledAtPosition", { position })
    : t("series.untitledWithDate", {
        position,
        date: formatLocalDate(locale, image.takenAt),
      }));
