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
  "avis",
]);

const hasHeifBrand = (bytes: Buffer): boolean => {
  if (bytes.toString("latin1", 4, 8) !== "ftyp") return false;

  if (HEIF_BRANDS.has(bytes.toString("latin1", 8, 12))) return true;

  const end = Math.min(bytes.readUInt32BE(0), bytes.length);

  for (let offset = 16; offset + 4 <= end; offset += 4) {
    if (HEIF_BRANDS.has(bytes.toString("latin1", offset, offset + 4))) {
      return true;
    }
  }

  return false;
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

  if (!hasHeifBrand(data)) return undefined;

  const { compression } = await sharp(bytes).metadata();

  return compression === "av1"
    ? "avif"
    : compression === "hevc"
      ? "heic"
      : undefined;
};
