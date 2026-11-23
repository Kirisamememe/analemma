import { type ExifValue, readExifTags } from "@/platform/images/read-exif-tags";

/** 撮影の情報として読む、Exif の tag の名前の一覧。 */
export const SHOT_TAGS = [
  "DateTimeOriginal",
  "OffsetTimeOriginal",
  "Make",
  "Model",
  "LensMake",
  "LensModel",
  "FocalLength",
  "FNumber",
  "ExposureTime",
  "ISOSpeedRatings",
  "SensitivityType",
  "StandardOutputSensitivity",
  "RecommendedExposureIndex",
  "ISOSpeed",
] as const; // GPS の tag は挙げない

/** 撮影の情報として読む、Exif の tag の名前。 */
export type ShotTagName = (typeof SHOT_TAGS)[number];

/** 写真の EXIF から読んだ、撮影の情報。 */
export type ShotInfo = {
  /** 撮影した現地の日時(時差を含まない ISO 8601 の形)。 */
  readonly takenAt?: string;
  /** 撮影した場所の、UTC からの時差(分)。 */
  readonly takenAtOffsetMinutes?: number;
  /** カメラ(メーカーと機種)。 */
  readonly camera?: string;
  /** レンズ(メーカーと機種)。 */
  readonly lens?: string;
  /** 焦点距離(mm)。 */
  readonly focalLength?: number;
  /** 絞り(F 値)。 */
  readonly fNumber?: number;
  /** シャッター速度(秒)。 */
  readonly exposureTime?: number;
  /** ISO 感度。 */
  readonly iso?: number;
};

const EXIF_DATE_TIME = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/v;
const OFFSET = /^([+\-])(\d{2}):(\d{2})$/v;
const MINUTES_PER_HOUR = 60;
const MAX_OFFSET_MINUTES = 18 * MINUTES_PER_HOUR; // DB の check の制約と同じ
const ISO_LIMIT = 65_535; // ISOSpeedRatings に書ける上限

const SENSITIVITY_TAGS: Readonly<Record<number, ShotTagName>> = {
  1: "StandardOutputSensitivity",
  2: "RecommendedExposureIndex",
  3: "ISOSpeed",
  4: "StandardOutputSensitivity",
  5: "StandardOutputSensitivity",
  6: "RecommendedExposureIndex",
  7: "StandardOutputSensitivity",
}; // SensitivityType の値ごとの、感度を書く tag

const first = (value: ExifValue | undefined) =>
  Array.isArray(value) ? value[0] : value;

const toText = (value: ExifValue | undefined): string | undefined => {
  const text = first(value);

  if (typeof text !== "string") return undefined;

  const trimmed = text.replaceAll("\0", "").trim();

  return trimmed === "" ? undefined : trimmed;
};

const toPositive = (value: ExifValue | undefined): number | undefined => {
  const number = first(value);

  return typeof number === "number" && Number.isFinite(number) && number > 0
    ? number
    : undefined;
};

const toTakenAt = (text: string | undefined): string | undefined => {
  if (text === undefined || !EXIF_DATE_TIME.test(text)) return undefined;

  const [year = 0, month = 0, day = 0, hour = 0, minute = 0, second = 0] = text
    .split(/[: ]/v)
    .map(Number);

  if (year < 1 || month < 1 || day < 1) return undefined; // Temporal は 0 の月と日で throw する

  const constrained = Temporal.PlainDateTime.from(
    { year, month, day, hour, minute, second },
    { overflow: "constrain" },
  );

  const iso = text.replace(EXIF_DATE_TIME, "$1-$2-$3T$4:$5:$6");

  return constrained.toString() === iso ? iso : undefined;
};

const toOffsetMinutes = (text: string | undefined): number | undefined => {
  const parts = OFFSET.exec(text ?? "");

  if (parts === null) return undefined;

  const [, sign, hours = "", minutes = ""] = parts;

  if (Number(minutes) >= MINUTES_PER_HOUR) return undefined;

  const total = Number(hours) * MINUTES_PER_HOUR + Number(minutes);

  if (total > MAX_OFFSET_MINUTES) return undefined;

  return sign === "-" && total > 0 ? -total : total;
};

const joinMakeAndModel = (
  make: string | undefined,
  model: string | undefined,
): string | undefined => {
  if (make === undefined || model === undefined) return model ?? make;

  const brand = make.split(" ")[0] ?? make;

  return model.toLowerCase().startsWith(brand.toLowerCase())
    ? model
    : `${make} ${model}`;
};

const toPositiveInteger = (
  value: ExifValue | undefined,
): number | undefined => {
  const number = toPositive(value);

  return Number.isInteger(number) ? number : undefined;
};

const toIso = (
  tags: ReadonlyMap<ShotTagName, ExifValue>,
): number | undefined => {
  const iso = toPositiveInteger(tags.get("ISOSpeedRatings"));

  if (iso !== undefined && iso < ISO_LIMIT) return iso;

  const type = first(tags.get("SensitivityType"));
  const tag = typeof type === "number" ? SENSITIVITY_TAGS[type] : undefined;

  if (tag === undefined) return iso;

  return toPositiveInteger(tags.get(tag)) ?? iso;
};

/** 読んだ Exif の tag を、撮影の情報にする。 */
export const toShotInfo = (
  tags: ReadonlyMap<ShotTagName, ExifValue>,
): ShotInfo => {
  const takenAt = toTakenAt(toText(tags.get("DateTimeOriginal")));

  const offset =
    takenAt === undefined
      ? undefined
      : toOffsetMinutes(toText(tags.get("OffsetTimeOriginal")));

  const camera = joinMakeAndModel(
    toText(tags.get("Make")),
    toText(tags.get("Model")),
  );

  const lens = joinMakeAndModel(
    toText(tags.get("LensMake")),
    toText(tags.get("LensModel")),
  );

  const focalLength = toPositive(tags.get("FocalLength"));
  const fNumber = toPositive(tags.get("FNumber"));
  const exposureTime = toPositive(tags.get("ExposureTime"));
  const iso = toIso(tags);

  return {
    ...(takenAt === undefined ? {} : { takenAt }),
    ...(offset === undefined ? {} : { takenAtOffsetMinutes: offset }),
    ...(camera === undefined ? {} : { camera }),
    ...(lens === undefined ? {} : { lens }),
    ...(focalLength === undefined ? {} : { focalLength }),
    ...(fNumber === undefined ? {} : { fNumber }),
    ...(exposureTime === undefined ? {} : { exposureTime }),
    ...(iso === undefined ? {} : { iso }),
  };
};

/** 写真の bytes から、EXIF の撮影の情報を読む。 */
export const readShotInfo = async (bytes: Uint8Array): Promise<ShotInfo> =>
  toShotInfo(await readExifTags(bytes, SHOT_TAGS));
