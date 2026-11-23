import sharp from "sharp";

import type { ImageFormat } from "@/platform/images/detect-image-format";
import { decodeHeif } from "@/platform/images/heif/decode-heif";

/** 色を変換する先の ICC profile。 */
export type IccProfile = "p3" | "srgb";

/** 写真を縮めるときの指定。 */
export type ShrinkOptions = {
  /** 写真の形式。 */
  readonly format: ImageFormat;
  /** 長辺の上限(px)。 */
  readonly longestEdge: number;
  /** 色を変換する先の ICC profile。 */
  readonly iccProfile: IccProfile;
};

/** 縮めた写真(可逆の PNG)。 */
export type ShrunkImage = {
  /** PNG の bytes。 */
  readonly png: Uint8Array;
  /** 幅(px)。 */
  readonly width: number;
  /** 高さ(px)。 */
  readonly height: number;
};

/** 写真の向きを画素に当て、長辺を上限まで縮め、色を変換した PNG にする。 */
export const shrinkImage = async (
  bytes: Uint8Array,
  { format, longestEdge, iccProfile }: ShrinkOptions,
): Promise<ShrunkImage> => {
  const { hasProfile, space } = await sharp(bytes).metadata();
  await using decoded =
    format === "heic" || (format === "avif" && !hasProfile)
      ? await decodeHeif(bytes, format)
      : undefined;

  const image = sharp(decoded?.path ?? bytes, {
    ignoreIcc: space === "srgb",
  });

  if (format === "png" && space === "rgb16" && !hasProfile) {
    image.pipelineColourspace("srgb");
  }

  const { data, info } = await image
    .autoOrient()
    .resize({
      width: longestEdge,
      height: longestEdge,
      fit: "inside",
      withoutEnlargement: true,
    })
    .withIccProfile(iccProfile)
    .png({ compressionLevel: 0 })
    .toBuffer({ resolveWithObject: true });

  return { png: data, width: info.width, height: info.height };
};
