import { describe, expect, test } from "bun:test";
import sharp, { type Exif } from "sharp";

import { readExifTags } from "@/platform/images/read-exif-tags";

const EXIF: Exif = {
  IFD0: { Make: "Apple", Model: "iPhone 15 Pro" },
  IFD2: {
    DateTimeOriginal: "2025:05:01 14:03:27",
    FNumber: "178/100",
    ISOSpeedRatings: "80",
  },
  IFD3: { GPSLatitudeRef: "N", GPSLatitude: "35/1 40/1 0/1" },
};

const photo = async (
  exif: Exif,
  format: "jpeg" | "png" | "webp" | "avif" = "jpeg",
): Promise<Uint8Array> =>
  new Uint8Array(
    await sharp({
      create: { width: 8, height: 8, channels: 3, background: "#808080" },
    })
      .withExif(exif)
      .toFormat(format)
      .toBuffer(),
  );

const heicFixture = async (): Promise<Uint8Array> => {
  const response = await fetch(
    new URL("rotated-with-gps.heic", import.meta.url),
  );

  return new Uint8Array(await response.arrayBuffer());
};

const read = async (bytes: Uint8Array) =>
  Object.fromEntries(
    await readExifTags(bytes, [
      "Make",
      "DateTimeOriginal",
      "FNumber",
      "ISOSpeedRatings",
    ]),
  );

describe("Exif の tag を読む", () => {
  test.each([
    ["JPEG", () => photo(EXIF, "jpeg")],
    ["PNG", () => photo(EXIF, "png")],
    ["WebP", () => photo(EXIF, "webp")],
    ["AVIF", () => photo(EXIF, "avif")],
    ["HEIC", heicFixture],
  ])(
    "%s から、名前を挙げた tag だけを、分数を割って読むこと",
    async (_format, make) => {
      expect(await read(await make())).toStrictEqual({
        Make: "Apple",
        DateTimeOriginal: "2025:05:01 14:03:27",
        FNumber: 1.78,
        ISOSpeedRatings: 80,
      });
    },
  );

  test("GPS は、名前を挙げたときだけ読むこと", async () => {
    const bytes = await photo(EXIF);

    expect([...(await readExifTags(bytes, ["Make"])).keys()]).toEqual(["Make"]);
    expect(
      (await readExifTags(bytes, ["GPSLatitude"])).has("GPSLatitude"),
    ).toBe(true);
  });

  test("ファイルに無い tag は返さないこと", async () => {
    expect(await read(await photo({}))).toStrictEqual({});
  });

  test("分母が 0 の分数は、null にすること", async () => {
    expect(
      await read(await photo({ IFD2: { FNumber: "28/0" } })),
    ).toStrictEqual({ FNumber: null });
  });
});
