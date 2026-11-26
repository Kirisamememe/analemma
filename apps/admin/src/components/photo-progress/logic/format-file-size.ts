const KILOBYTE = 1024;
const MEGABYTE = KILOBYTE * KILOBYTE;

/** ファイルの大きさを、言語の書き方で KB か MB にする。 */
export const formatFileSize = (locale: string, bytes: number): string =>
  bytes < MEGABYTE
    ? new Intl.NumberFormat(locale, {
        style: "unit",
        unit: "kilobyte",
      }).format(Math.max(1, Math.ceil(bytes / KILOBYTE)))
    : new Intl.NumberFormat(locale, {
        style: "unit",
        unit: "megabyte",
        maximumFractionDigits: 1,
      }).format(bytes / MEGABYTE);
