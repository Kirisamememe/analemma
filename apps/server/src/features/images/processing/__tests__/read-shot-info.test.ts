import { describe, expect, test } from "bun:test";

import {
  SHOT_TAGS,
  type ShotTagName,
  readShotInfo,
  toShotInfo,
} from "@/features/images/processing/read-shot-info";
import type { ExifValue } from "@/platform/images/read-exif-tags";

const DATE_TIME = "2025:05:01 14:03:27";
const TAKEN_AT = "2025-05-01T14:03:27";

const shotInfoOf = (tags: Partial<Record<ShotTagName, ExifValue>>) =>
  toShotInfo(
    new Map(
      SHOT_TAGS.flatMap((name): [ShotTagName, ExifValue][] => {
        const value = tags[name];

        return value === undefined ? [] : [[name, value]];
      }),
    ),
  );

describe("写真から読む", () => {
  test("回転と GPS を持つ HEIC から、撮影の情報を読み、GPS は返さないこと", async () => {
    const response = await fetch(
      new URL(
        "../../../../platform/images/__tests__/rotated-with-gps.heic",
        import.meta.url,
      ),
    );

    expect(
      await readShotInfo(new Uint8Array(await response.arrayBuffer())),
    ).toStrictEqual({
      takenAt: TAKEN_AT,
      takenAtOffsetMinutes: 540,
      camera: "Apple iPhone 15 Pro",
      lens: "Apple iPhone 15 Pro back triple camera 6.765mm f/1.78",
      focalLength: 6.765,
      fNumber: 1.78,
      exposureTime: 1 / 120,
      iso: 80,
    });
  });
});

describe("撮影日時と時差", () => {
  test("時差が無ければ、撮影日時だけを返すこと", () => {
    expect(shotInfoOf({ DateTimeOriginal: DATE_TIME })).toStrictEqual({
      takenAt: TAKEN_AT,
    });
  });

  test("撮影日時が無ければ、時差も返さないこと", () => {
    expect(shotInfoOf({ OffsetTimeOriginal: "+09:00" })).toStrictEqual({});
  });

  test.each([
    "0000:00:00 00:00:00",
    "2025:02:29 12:00:00",
    "2025:05:01 24:00:00",
    "2025:13:01 12:00:00",
    "2025-05-01 14:03:27",
    "    :  :     :  :  ",
  ])("暦に無いか、形の違う撮影日時 %p は返さないこと", (taken) => {
    expect(
      shotInfoOf({ DateTimeOriginal: taken, OffsetTimeOriginal: "+09:00" }),
    ).toStrictEqual({});
  });

  test.each([
    ["-03:30", -210],
    ["+14:00", 840],
    ["-00:00", 0],
    ["+18:00", 1080],
  ])("時差 %p を、%p 分として返すこと", (offset, minutes) => {
    expect(
      shotInfoOf({ DateTimeOriginal: DATE_TIME, OffsetTimeOriginal: offset }),
    ).toStrictEqual({ takenAt: TAKEN_AT, takenAtOffsetMinutes: minutes });
  });

  test.each(["+18:01", "+09:60", "09:00", "+9:00"])(
    "±18時間を超えるか、形の違う時差 %p は返さないこと",
    (offset) => {
      expect(
        shotInfoOf({ DateTimeOriginal: DATE_TIME, OffsetTimeOriginal: offset }),
      ).toStrictEqual({ takenAt: TAKEN_AT });
    },
  );
});

describe("カメラとレンズ", () => {
  test.each([
    [{ Make: "Canon", Model: "Canon EOS R5" }, "Canon EOS R5"],
    [{ Make: "NIKON CORPORATION", Model: "NIKON Z 6_2" }, "NIKON Z 6_2"],
    [{ Make: "SONY", Model: "ILCE-7M4" }, "SONY ILCE-7M4"],
    [{ Make: "  FUJIFILM \0", Model: "X-T5  " }, "FUJIFILM X-T5"],
    [{ Make: "Canon" }, "Canon"],
    [{ Model: "X-T5" }, "X-T5"],
    [{ Make: " ", Model: "X-T5" }, "X-T5"],
  ])("メーカーと機種 %p を、重ねずに1つの文字列にすること", (tags, camera) => {
    expect(shotInfoOf(tags)).toStrictEqual({ camera });
  });

  test("レンズも、メーカーと機種を1つの文字列にすること", () => {
    expect(
      shotInfoOf({ LensMake: "FUJIFILM", LensModel: "XF23mmF1.4 R" }),
    ).toStrictEqual({ lens: "FUJIFILM XF23mmF1.4 R" });
  });
});

describe("露出", () => {
  test("値が複数あれば、最初の値を使うこと", () => {
    expect(
      shotInfoOf({ ISOSpeedRatings: [400, 0], Make: ["Canon", "Nikon"] }),
    ).toStrictEqual({ camera: "Canon", iso: 400 });
  });

  test("0・負の数・分母が 0 の分数・整数でない ISO は返さないこと", () => {
    expect(
      shotInfoOf({
        FocalLength: 0,
        FNumber: null,
        ExposureTime: -1,
        ISOSpeedRatings: 100.5,
      }),
    ).toStrictEqual({});
  });
});
