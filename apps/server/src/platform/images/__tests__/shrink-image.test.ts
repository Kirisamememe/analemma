import { describe, expect, test } from "bun:test";
import { createReader } from "exifreader/core";
import { png } from "exifreader/formats";
import { exif, gps, icc } from "exifreader/groups";
import sharp, { type Sharp } from "sharp";

import { type ShrunkImage, shrinkImage } from "@/platform/images/shrink-image";

/** 写真の幅と高さ。 */
type Size = {
  /** 幅(px)。 */
  readonly width: number;
  /** 高さ(px)。 */
  readonly height: number;
};

/** 画像の中の1点。 */
type Point = {
  /** 左からの px。 */
  readonly x: number;
  /** 上からの px。 */
  readonly y: number;
};

const OPTIONS = { longestEdge: 2560, iccProfile: "p3" } as const;

const XMP_WITH_GPS =
  '<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description xmlns:exif="http://ns.adobe.com/exif/1.0/" exif:GPSLatitude="35,40.0N"/></rdf:RDF></x:xmpmeta>';

const metadataReader = createReader({
  formats: [png],
  groups: [exif, gps, icc],
});

const photo = ({ width, height }: Size): Sharp =>
  sharp({
    create: { width, height, channels: 3, background: "#0000ff" },
  }).composite([
    {
      input: {
        create: {
          width: width / 2,
          height: height / 2,
          channels: 3,
          background: "#ff0000",
        },
      },
      left: 0,
      top: 0,
    },
  ]);

const shrinkJpeg = async (image: Sharp): Promise<ShrunkImage> =>
  shrinkImage(new Uint8Array(await image.jpeg().toBuffer()), {
    ...OPTIONS,
    format: "jpeg",
  });

const rotatedJpeg = async (): Promise<Sharp> =>
  sharp(await photo({ width: 96, height: 64 }).png().toBuffer())
    .withMetadata({ orientation: 6 })
    .withExif({
      IFD0: { Make: "Apple" },
      IFD3: { GPSLatitudeRef: "N", GPSLatitude: "35/1 40/1 0/1" },
    })
    .withXmp(XMP_WITH_GPS);

const shrinkHeic = async (): Promise<ShrunkImage> => {
  const response = await fetch(
    new URL("rotated-with-gps.heic", import.meta.url),
  );

  return shrinkImage(new Uint8Array(await response.arrayBuffer()), {
    ...OPTIONS,
    format: "heic",
  });
};

const colorAt = async (
  image: ShrunkImage,
  { x, y }: Point,
): Promise<"red" | "blue"> => {
  const { data, info } = await sharp(image.png)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const offset = (y * info.width + x) * info.channels;

  return (data[offset] ?? 0) > (data[offset + 2] ?? 0) ? "red" : "blue";
};

describe("長辺", () => {
  test.each([
    { width: 3000, height: 2000, shrunk: [2560, 1707] },
    { width: 2000, height: 3000, shrunk: [1707, 2560] },
    { width: 96, height: 64, shrunk: [96, 64] },
  ])(
    "$width×$height の写真を、長辺が上限を超えないように、大きくせずに縮めること",
    async (size) => {
      const { width, height } = await shrinkJpeg(photo(size));

      expect([width, height]).toEqual([...size.shrunk]);
    },
  );
});

describe("向きとメタデータ", () => {
  test.each([
    [
      "EXIF の Orientation を持つ JPEG",
      async () => shrinkJpeg(await rotatedJpeg()),
    ],
    ["回転の指定と EXIF の Orientation を持つ HEIC", shrinkHeic],
  ])("%s を、一度だけ回して表示の向きにすること", async (_title, shrink) => {
    const image = await shrink();

    expect([image.width, image.height]).toEqual([64, 96]);
    expect(await colorAt(image, { x: 60, y: 4 })).toBe("red");
    expect(await colorAt(image, { x: 4, y: 4 })).toBe("blue");
  });

  test.each([
    ["JPEG", async () => shrinkJpeg(await rotatedJpeg())],
    ["HEIC", shrinkHeic],
  ])(
    "%s の EXIF・GPS・XMP を残さず、P3 の ICC だけを付けた PNG にすること",
    async (_format, shrink) => {
      const image = await shrink();
      const tags = await metadataReader.load(image.png);
      const { format, xmp } = await sharp(image.png).metadata();

      expect([format, xmp]).toEqual(["png", undefined]);
      expect(tags.exif).toBeUndefined();
      expect(tags.gps).toBeUndefined();
      expect(tags.icc?.["ICC Description"]?.description).toBe("sP3C");
    },
  );
});
