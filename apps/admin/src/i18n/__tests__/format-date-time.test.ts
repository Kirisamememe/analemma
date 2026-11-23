import { describe, expect, test } from "bun:test";

import {
  formatDateTime,
  formatLocalDate,
  formatLocalDateTime,
} from "@/i18n/format-date-time";

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

describe("formatLocalDateTime", () => {
  test("時差を含まない日時を、時差で動かさずに書く", () => {
    const local = "2025-05-01T23:42:07";

    expect(formatLocalDateTime("ja", local)).toBe("2025/05/01 23:42");
    expect(formatLocalDateTime("en", local)).toBe("May 1, 2025 at 11:42 PM");
    expect(formatLocalDateTime("zh-Hans", local)).toBe("2025年5月1日 23:42");
  });

  test("日付だけにもでき、秒の小数を持つ日時も読む", () => {
    expect(formatLocalDate("ja", "2025-05-01T00:00:00.25")).toBe("2025/05/01");
  });
});
