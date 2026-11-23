import { describe, expect, test } from "bun:test";

import { toShotInfo } from "../shot-info";

import { createI18n } from "@/i18n/create-i18n";
import type { Locale } from "@/i18n/locales";

type Shot = Parameters<typeof toShotInfo>[0];

const NONE: Shot = {
  takenAt: null,
  takenAtOffset: null,
  camera: null,
  lens: null,
  focalLength: null,
  fNumber: null,
  exposureTime: null,
  iso: null,
};

const rows = (shot: Partial<Shot>, locale: Locale = "ja") =>
  toShotInfo({ ...NONE, ...shot }, { locale, t: createI18n(locale).t }).map(
    ({ label, value }) => [label, value],
  );

const exposure = (seconds: number) =>
  rows({ exposureTime: seconds }).map(([, value]) => value);

describe("toShotInfo", () => {
  test("分からない項目は並べない", () => {
    expect(rows({})).toEqual([]);
    expect(rows({ camera: "X-T5", iso: 200 })).toEqual([
      ["imageDetail.camera", "X-T5"],
      ["imageDetail.iso", "200"],
    ]);
  });

  test("全部の項目を、言語の書き方で、決まった順に並べる", () => {
    const shot = {
      takenAt: "2025-05-01T18:42:07",
      takenAtOffset: "+09:00",
      camera: "FUJIFILM X-T5",
      lens: "XF16-55mmF2.8 R LM WR",
      focalLength: 23.5,
      fNumber: 2.8,
      exposureTime: 0.004,
      iso: 12_800,
    };

    expect(rows(shot)).toEqual([
      ["imageDetail.takenAt", "2025/05/01 18:42(UTC+09:00)"],
      ["imageDetail.camera", "FUJIFILM X-T5"],
      ["imageDetail.lens", "XF16-55mmF2.8 R LM WR"],
      ["imageDetail.focalLength", "23.5 mm"],
      ["imageDetail.fNumber", "f/2.8"],
      ["imageDetail.exposureTime", "1/250秒"],
      ["imageDetail.iso", "12800"],
    ]);
    expect(rows(shot, "en").map(([, value]) => value)).toEqual([
      "May 1, 2025 at 6:42 PM (UTC+09:00)",
      "FUJIFILM X-T5",
      "XF16-55mmF2.8 R LM WR",
      "23.5 mm",
      "f/2.8",
      "1/250 sec",
      "12800",
    ]);
  });

  test("時差が分からなければ、撮影日時だけを書く", () => {
    expect(rows({ takenAt: "2025-05-01T18:42:07" }, "zh-Hans")).toEqual([
      ["imageDetail.takenAt", "2025年5月1日 18:42"],
    ]);
  });

  test("シャッター速度は、1/4 秒より短ければ分数、長ければ小数で書く", () => {
    expect(exposure(1 / 8000)).toEqual(["1/8000秒"]);
    expect(exposure(1 / 3)).toEqual(["0.3秒"]);
    expect(exposure(0.25)).toEqual(["1/4秒"]);
    expect(exposure(2.5)).toEqual(["2.5秒"]);
    expect(exposure(30)).toEqual(["30秒"]);
  });

  test("焦点距離と絞りは小数を1桁までにし、整数なら小数を書かない", () => {
    expect(rows({ focalLength: 35, fNumber: 8 })).toEqual([
      ["imageDetail.focalLength", "35 mm"],
      ["imageDetail.fNumber", "f/8"],
    ]);
    expect(rows({ focalLength: 18.04, fNumber: 1.43 })).toEqual([
      ["imageDetail.focalLength", "18 mm"],
      ["imageDetail.fNumber", "f/1.4"],
    ]);
  });
});
