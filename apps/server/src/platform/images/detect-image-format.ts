import { Buffer } from "node:buffer";
import sharp from "sharp";

/** 写真として識別する形式。 */
export type ImageFormat = "jpeg" | "png" | "webp" | "heic" | "avif";

const PNG = Buffer.from("89504e470d0a1a0a", "hex");

const HEIF_BRANDS = new Set([
  "heic",
  "heix",
  "hevc",
  "hevx",
  "heim",
  "heis",
  "hevm",
  "hevs",
  "mif1",
  "msf1",
  "miaf",
  "avif",
]);

const heifBrand = (bytes: Buffer): "avif" | "heif" | undefined => {
  if (bytes.toString("latin1", 4, 8) !== "ftyp") return undefined;

  const major = bytes.toString("latin1", 8, 12);
  const end = Math.min(bytes.readUInt32BE(0), bytes.length);
  let hasAvif = major === "avif";
  let hasHeif = HEIF_BRANDS.has(major);

  if (major === "avis") return undefined;

  for (let offset = 16; offset + 4 <= end; offset += 4) {
    const brand = bytes.toString("latin1", offset, offset + 4);

    if (brand === "avis") return undefined;

    if (brand === "avif") hasAvif = true;

    if (HEIF_BRANDS.has(brand)) hasHeif = true;
  }

  if (hasAvif) return "avif";

  return hasHeif ? "heif" : undefined;
};

/** 写真の bytes から、形式を見分ける。 */
export const detectImageFormat = async (
  bytes: Uint8Array,
): Promise<ImageFormat | undefined> => {
  const data = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  if (data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return "jpeg";

  if (data.subarray(0, PNG.length).equals(PNG)) return "png";

  if (
    data.toString("latin1", 0, 4) === "RIFF" &&
    data.toString("latin1", 8, 12) === "WEBP"
  ) {
    return "webp";
  }

  const brand = heifBrand(data);

  if (brand !== "heif") return brand;

  const { compression } = await sharp(bytes).metadata();

  return compression === "av1"
    ? "avif"
    : compression === "hevc"
      ? "heic"
      : undefined;
};
