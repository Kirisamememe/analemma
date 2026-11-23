import { describe, expect, test } from "bun:test";

import {
  chooseWidths,
  createDeliveryImages,
} from "@/features/images/processing/create-delivery-images";
import { detectImageFormat } from "@/platform/images/detect-image-format";
import { readExifTags } from "@/platform/images/read-exif-tags";
import { shrinkImage } from "@/platform/images/shrink-image";

const fixture = async (file: string): Promise<Uint8Array> => {
  const response = await fetch(new URL(file, import.meta.url));

  return new Uint8Array(await response.arrayBuffer());
};

describe("段の幅", () => {
  test.each([
    [2560, [2560, 1920, 1280, 640]],
    [1707, [1707, 1280, 640]],
    [1000, [1000, 640]],
    [640, [640]],
    [96, [96]],
  ])("一番大きい段が %p なら、%p の幅の段を作ること", (largest, widths) => {
    expect(chooseWidths(largest)).toEqual(widths);
  });
});

describe("配信用の画像", () => {
  test("HEIC から、表示の向きの AVIF を作り、EXIF と GPS を残さないこと", async () => {
    const result = await createDeliveryImages(
      await fixture(
        "../../../../platform/images/__tests__/rotated-with-gps.heic",
      ),
    );

    if (result._tag !== "Created") throw new Error(result._tag);

    const [image, ...rest] = result.images;

    if (image === undefined) throw new Error("画像が無い");

    const tags = await readExifTags(image.avif, [
      "Make",
      "DateTimeOriginal",
      "GPSLatitude",
      "GPSLongitude",
    ]);

    expect([image.width, image.height, rest.length]).toEqual([64, 96, 0]);
    expect(await detectImageFormat(image.avif)).toBe("avif");
    expect(tags.size).toBe(0);
  });

  test("横長の JPEG から、幅が大きい順に4段の AVIF を作ること", async () => {
    const result = await createDeliveryImages(await fixture("wide-red.jpg"));

    if (result._tag !== "Created") throw new Error(result._tag);

    const widths = await Promise.all(
      result.images.map(async (image) => {
        const decoded = await shrinkImage(image.avif, {
          format: "avif",
          longestEdge: 3000,
          iccProfile: "p3",
        });

        return [image.width, decoded.width];
      }),
    );

    expect(widths).toEqual([
      [2560, 2560],
      [1920, 1920],
      [1280, 1280],
      [640, 640],
    ]);
  });

  test.each(["red.bmp", "red.jp2"])(
    "%s では UnsupportedFormat を返すこと",
    async (file) => {
      const result = await createDeliveryImages(await fixture(file));

      expect(result).toEqual({ _tag: "UnsupportedFormat" });
    },
  );

  test("先頭が JPEG の壊れたファイルでは、throw すること", async () => {
    const bytes = (await fixture("wide-red.jpg")).subarray(0, 16);

    const failure: unknown = await createDeliveryImages(bytes).catch(
      (error: unknown) => error,
    );

    expect(failure).toBeInstanceOf(Error);
  });

  test("受けない形式(SVG)では、UnsupportedFormat を返すこと", async () => {
    const svg = new TextEncoder().encode(
      '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"/>',
    );

    expect(await createDeliveryImages(svg)).toEqual({
      _tag: "UnsupportedFormat",
    });
  });

  test("形式を識別できない bytes では UnsupportedFormat を返すこと", async () => {
    expect(
      await createDeliveryImages(new TextEncoder().encode("not an image")),
    ).toEqual({ _tag: "UnsupportedFormat" });
  });
});
