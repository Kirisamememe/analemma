import type { ApiOutputs } from "@/api/api-types";
import { formatLocalDateTime } from "@/i18n/format-date-time";
import type { Locale } from "@/i18n/locales";
import type { MessageKey, useTranslate } from "@/i18n/use-translate";

type Shot = Pick<
  ApiOutputs["admin"]["images"]["get"],
  | "takenAt"
  | "takenAtOffset"
  | "camera"
  | "lens"
  | "focalLength"
  | "fNumber"
  | "exposureTime"
  | "iso"
>;

/** 撮影の情報を書くときの、言語と訳。 */
export type ShotInfoContext = {
  /** 書く言語。 */
  readonly locale: Locale;
  /** 今の言語で訳を引く関数。 */
  readonly t: ReturnType<typeof useTranslate>;
};

/** 撮影の情報の1行。 */
export type ShotInfoRow = {
  /** 表示名の訳のキー。 */
  readonly label: MessageKey;
  /** 言語の書き方で書いた値。 */
  readonly value: string;
};

const FRACTION_LIMIT = 1 / 4;

const numberFormat = (locale: Locale, options: Intl.NumberFormatOptions) =>
  new Intl.NumberFormat(locale, { maximumFractionDigits: 1, ...options });

const formatExposure = (locale: Locale, seconds: number): string => {
  const format = numberFormat(locale, {
    style: "unit",
    unit: "second",
    unitDisplay: "short",
  });

  if (seconds <= 0 || seconds > FRACTION_LIMIT) return format.format(seconds);

  const fraction = `1/${String(Math.round(1 / seconds))}`;

  return format
    .formatToParts(1)
    .map(({ type, value }) => (type === "integer" ? fraction : value))
    .join(""); // 単位と間の空きは、言語の書き方のまま
};

const formatTakenAt = (
  { takenAt, takenAtOffset }: Record<"takenAt", string> & Shot,
  { locale, t }: ShotInfoContext,
): string => {
  const dateTime = formatLocalDateTime(locale, takenAt);

  return takenAtOffset === null
    ? dateTime
    : t("imageDetail.takenAtWithOffset", { dateTime, offset: takenAtOffset });
};

/** 画像の撮影の情報を、言語の書き方で並べる。 */
export const toShotInfo = (
  shot: Shot,
  context: ShotInfoContext,
): ShotInfoRow[] => {
  const { locale } = context;

  const rows: Array<ShotInfoRow | undefined> = [
    shot.takenAt === null
      ? undefined
      : {
          label: "imageDetail.takenAt",
          value: formatTakenAt({ ...shot, takenAt: shot.takenAt }, context),
        },
    shot.camera === null
      ? undefined
      : { label: "imageDetail.camera", value: shot.camera },
    shot.lens === null
      ? undefined
      : { label: "imageDetail.lens", value: shot.lens },
    shot.focalLength === null
      ? undefined
      : {
          label: "imageDetail.focalLength",
          value: numberFormat(locale, {
            style: "unit",
            unit: "millimeter",
            unitDisplay: "short",
          }).format(shot.focalLength),
        },
    shot.fNumber === null
      ? undefined
      : {
          label: "imageDetail.fNumber",
          value: `f/${numberFormat(locale, {}).format(shot.fNumber)}`,
        },
    shot.exposureTime === null
      ? undefined
      : {
          label: "imageDetail.exposureTime",
          value: formatExposure(locale, shot.exposureTime),
        },
    shot.iso === null
      ? undefined
      : {
          label: "imageDetail.iso",
          value: numberFormat(locale, { useGrouping: false }).format(shot.iso),
        },
  ];

  return rows.filter((row) => row !== undefined);
};
