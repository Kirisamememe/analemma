import { expect, test } from "bun:test";
import sharp from "sharp";

import { detectImageFormat } from "@/platform/images/detect-image-format";

const encode = async (
  format: "jpeg" | "png" | "webp" | "avif" | "gif" | "tiff",
) =>
  new Uint8Array(
    await sharp({
      create: { width: 8, height: 8, channels: 3, background: "#808080" },
    })
      .toFormat(format)
      .toBuffer(),
  );

test.each(["jpeg", "png", "webp"] as const)(
  "%s を見分けること",
  async (format) => {
    expect(await detectImageFormat(await encode(format))).toBe(format);
  },
);

test("HEIF を、中の圧縮の形式で AVIF と HEIC に分けること", async () => {
  const heic = await fetch(new URL("rotated-with-gps.heic", import.meta.url));

  expect(await detectImageFormat(await encode("avif"))).toBe("avif");
  expect(
    await detectImageFormat(new Uint8Array(await heic.arrayBuffer())),
  ).toBe("heic");
});

test("major brand が mif1 でも compatible brand が avif なら AVIF として読むこと", async () => {
  const file = await fetch(
    new URL("../heif/__tests__/p3-red.avif", import.meta.url),
  );

  const bytes = new Uint8Array(await file.arrayBuffer());

  bytes.set(new TextEncoder().encode("mif1"), 8);

  expect(await detectImageFormat(bytes)).toBe("avif");
});

test("アニメーション AVIF を受けないこと", async () => {
  const animation = await fetch(new URL("animated.avif", import.meta.url));

  expect(
    await detectImageFormat(new Uint8Array(await animation.arrayBuffer())),
  ).toBeUndefined();
});

test("SVG を受けないこと", async () => {
  const svg = new TextEncoder().encode(
    '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"/>',
  );

  expect(await detectImageFormat(svg)).toBeUndefined();
});

test.each(["gif", "tiff"] as const)("%s を受けないこと", async (format) => {
  expect(await detectImageFormat(await encode(format))).toBeUndefined();
});
