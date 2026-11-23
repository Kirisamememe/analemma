import { expect, test } from "bun:test";
import { createReader } from "exifreader/core";
import { avif } from "exifreader/formats";
import { exif, gps, icc } from "exifreader/groups";
import sharp from "sharp";

import { createDeliveryImages } from "@/features/images/processing/create-delivery-images";
import { encodeAvif } from "@/platform/images/encode-avif";
import { shrinkImage } from "@/platform/images/shrink-image";

const metadataReader = createReader({
  formats: [avif],
  groups: [exif, gps, icc],
});

const jpegWithGps = async (): Promise<Uint8Array> =>
  new Uint8Array(
    await sharp({
      create: { width: 2560, height: 1707, channels: 3, background: "#808080" },
    })
      .withIccProfile("p3")
      .withExif({
        IFD0: { Make: "Apple" },
        IFD3: { GPSLatitudeRef: "N", GPSLatitude: "35/1 40/1 0/1" },
      })
      .withXmp(
        '<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description xmlns:exif="http://ns.adobe.com/exif/1.0/" exif:GPSLatitude="35,40.0N"/></rdf:RDF></x:xmpmeta>',
      )
      .jpeg()
      .toBuffer(),
  );

test("縦横の比を保って、指定した幅の AVIF にすること", async () => {
  const image = await encodeAvif(await jpegWithGps(), {
    width: 640,
    quality: 50,
  });

  const { format, compression } = await sharp(image.avif).metadata();

  expect([image.width, image.height]).toEqual([640, 427]);
  expect([format, compression]).toEqual(["heif", "av1"]);
});

test("EXIF・GPS・XMP を残さず、P3 の ICC だけを付けること", async () => {
  const image = await encodeAvif(await jpegWithGps(), {
    width: 640,
    quality: 50,
  });

  const tags = await metadataReader.load(image.avif);
  const { exif: exifBytes, xmp } = await sharp(image.avif).metadata();

  expect([exifBytes, xmp]).toEqual([undefined, undefined]);
  expect(tags.exif).toBeUndefined();
  expect(tags.gps).toBeUndefined();
  expect(tags.icc?.["ICC Description"]?.description).toBe("sP3C");
});

test.each([
  { file: "p3-red.png", format: "png", expected: [255, 0, 0] },
  { file: "srgb-red.png", format: "png", expected: [234, 51, 35] },
  { file: "srgb-red-16.png", format: "png", expected: [234, 51, 35] },
  {
    file: "../heif/__tests__/p3-red.avif",
    format: "avif",
    expected: [255, 0, 0, 128],
  },
  {
    file: "../heif/__tests__/srgb-red.avif",
    format: "avif",
    expected: [234, 51, 35],
  },
] as const)(
  "$file を縮めた配信用 AVIF が元の赤と透明度を保つこと",
  async ({ file, format, expected }) => {
    const input = await fetch(new URL(file, import.meta.url));

    const largest = await shrinkImage(
      new Uint8Array(await input.arrayBuffer()),
      { format, longestEdge: 12, iccProfile: "p3" },
    );

    const image = await encodeAvif(largest.png, { width: 8, quality: 50 });

    const pixels = await sharp(image.avif, { ignoreIcc: true })
      .raw()
      .toBuffer({ resolveWithObject: true });

    expect(pixels.info.channels).toBe(expected.length);

    for (const [index, value] of expected.entries()) {
      expect(
        Math.abs((pixels.data[index] ?? -255) - value),
      ).toBeLessThanOrEqual(3);
    }
  },
);

const cmykJpeg = async (): Promise<Uint8Array> => {
  const cyan = await sharp({
    create: { width: 3000, height: 32, channels: 3, background: "#00a0bb" },
  })
    .pipelineColourspace("rgb16")
    .withIccProfile("p3")
    .png()
    .toBuffer();

  return sharp(cyan, { ignoreIcc: true })
    .withIccProfile("cmyk")
    .jpeg({ quality: 100 })
    .toBuffer();
};

test.each([
  {
    name: "cICP で Display P3 を指定した PNG",
    input: async () => {
      const response = await fetch(new URL("cicp-red.png", import.meta.url));

      return new Uint8Array(await response.arrayBuffer());
    },
    expected: [253, 0, 0],
  },
  {
    name: "ICC のある CMYK JPEG",
    input: cmykJpeg,
    expected: [3, 140, 161],
  },
])(
  "$name から作った4段の AVIF が元の色を保つこと",
  async ({ input, expected }) => {
    const result = await createDeliveryImages(await input());

    if (result._tag !== "Created") throw new Error(result._tag);

    const widths = await Promise.all(
      result.images.map(async ({ avif: bytes }) => {
        const { data, info } = await sharp(bytes, { ignoreIcc: true })
          .raw()
          .toBuffer({ resolveWithObject: true });

        for (const [channel, value] of expected.entries()) {
          expect(Math.abs((data[channel] ?? -255) - value)).toBeLessThanOrEqual(
            3,
          );
        }

        return info.width;
      }),
    );

    expect(widths).toEqual([2560, 1920, 1280, 640]);
  },
);
