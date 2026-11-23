import { describe, expect, test } from "bun:test";

import { formatDateTime } from "@/i18n/format-date-time";

describe("formatDateTime", () => {
  test("言語ごとの書き方で、日付と時刻を出す", () => {
    const iso = "2026-03-04T05:06:00.000Z";

    const expected = (locale: string): string =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(iso));

    expect(formatDateTime("ja", iso)).toBe(expected("ja"));
    expect(formatDateTime("en", iso)).toBe(expected("en"));
    expect(formatDateTime("ja", iso)).not.toBe(formatDateTime("en", iso));
  });
});
