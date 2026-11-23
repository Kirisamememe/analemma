import type { Locale } from "@/i18n/locales";

/** ISO 8601 の日時を、言語の書き方で、日付と時刻にする。 */
export const formatDateTime = (locale: Locale, iso: string): string =>
  new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));

const formatLocal = (
  locale: Locale,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat =>
  new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" });

/** 時差を含まない ISO 8601 の日時(撮影した現地の日時)を、言語の書き方で、日付と時刻にする。 */
export const formatLocalDateTime = (locale: Locale, local: string): string =>
  formatLocal(locale, { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(`${local}Z`),
  );

/** 時差を含まない ISO 8601 の日時(撮影した現地の日時)を、言語の書き方で、日付にする。 */
export const formatLocalDate = (locale: Locale, local: string): string =>
  formatLocal(locale, { dateStyle: "medium" }).format(new Date(`${local}Z`));
