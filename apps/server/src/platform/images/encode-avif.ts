import sharp from "sharp";

/** AVIF にするときの指定。 */
export type AvifOptions = {
  /** 幅(px)。 */
  readonly width: number;
  /** AVIF の quality。 */
  readonly quality: number;
};

/** AVIF の画像。 */
export type AvifImage = {
  /** AVIF の bytes。 */
  readonly avif: Uint8Array;
  /** 幅(px)。 */
  readonly width: number;
  /** 高さ(px)。 */
  readonly height: number;
};

/** 縮めた写真を、指定した幅の AVIF にする。 */
export const encodeAvif = async (
  bytes: Uint8Array,
  { width, quality }: AvifOptions,
): Promise<AvifImage> => {
  const { data, info } = await sharp(bytes)
    .resize({ width })
    .keepIccProfile()
    .avif({ quality })
    .toBuffer({ resolveWithObject: true });

  return { avif: data, width: info.width, height: info.height };
};
