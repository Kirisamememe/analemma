/** ISO 8601 の日時を、言語の書き方で、日付と時刻にする。 */
export const formatDateTime = (locale: string, iso: string): string =>
  new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
