import { describe, expect, test } from "bun:test";

import { formatDateTime, formatLocalDateTime } from "@/i18n/format-date-time";
import { LOCALES } from "@/i18n/locales";

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

    for (const locale of LOCALES) {
      const expected = new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "UTC",
      }).format(Date.UTC(2025, 4, 1, 23, 42, 7));

      expect(formatLocalDateTime(locale, local)).toBe(expected);
    }
  });

  test("UTC より西で見ても、撮影地の日付を保ち、秒の小数を読める", () => {
    const result = Bun.spawnSync({
      cmd: [
        process.execPath,
        "--eval",
        'import { formatLocalDate } from "../format-date-time.ts"; console.log(formatLocalDate("ja", "2025-05-01T00:00:00.25"));',
      ],
      cwd: import.meta.dir,
      env: { TZ: "America/Los_Angeles" },
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout.toString().trim()).toBe("2025/05/01");
  });
});
