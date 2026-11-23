import sharp from "sharp";

import type { ImageFormat } from "@/platform/images/detect-image-format";
import { decodeHeif } from "@/platform/images/heif/decode-heif";
import { convertPngCicp, readPngCicp } from "@/platform/images/png-cicp";

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

  const cicp = format === "png" ? readPngCicp(bytes) : undefined;

  const image = sharp(decoded?.path ?? bytes, {
    ignoreIcc: cicp !== undefined || space === "srgb",
  })
    .autoOrient()
    .resize({
      width: longestEdge,
      height: longestEdge,
      fit: "inside",
      withoutEnlargement: true,
    });

  if (space === "cmyk" && hasProfile) {
    image.pipelineColourspace("cmyk").toColourspace("cmyk");
  } else if (
    format === "png" &&
    space === "rgb16" &&
    !hasProfile &&
    cicp === undefined
  ) {
    image.pipelineColourspace("srgb");
  }

  const oriented =
    cicp === undefined ? image : sharp(await convertPngCicp(image, cicp));

  const { data, info } = await oriented
    .withIccProfile(iccProfile)
    .png({ compressionLevel: 0 })
    .toBuffer({ resolveWithObject: true });

  return { png: data, width: info.width, height: info.height };
};
