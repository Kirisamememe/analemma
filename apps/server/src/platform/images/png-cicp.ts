import type { Sharp } from "sharp";

/** IDAT より前にある cICP chunk を、長さと CRC ごと返す。 */
export const readPngCicp = (bytes: Uint8Array): Uint8Array | undefined => {
  const data = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  for (let offset = 8; offset + 12 <= bytes.length;) {
    const length = data.readUInt32BE(offset);
    const type = data.toString("latin1", offset + 4, offset + 8);
    const end = offset + length + 12;

    if (type === "IDAT" || end > bytes.length) return undefined;

    if (type === "cICP" && length === 4) return bytes.subarray(offset, end);

    offset = end;
  }

  return undefined;
};

/** 縮めた画素に元の cICP を付け、Display P3 の16-bit PNG に変換する。 */
export const convertPngCicp = async (
  image: Sharp,
  cicp: Uint8Array,
): Promise<Uint8Array> => {
  const { data, info } = await image
    .toColourspace("rgb16")
    .png({ compressionLevel: 0 })
    .toBuffer({ resolveWithObject: true });

  const afterHeader = 33; // 署名と IHDR を合わせた長さ

  const converter = Bun.spawn(
    [
      "ffmpeg",
      "-v",
      "error",
      "-f",
      "image2pipe",
      "-c:v",
      "png",
      "-i",
      "pipe:0",
      "-vf",
      "scale=out_primaries=smpte432:out_transfer=iec61966-2-1:out_range=full",
      "-pix_fmt",
      info.channels === 4 ? "rgba64be" : "rgb48be",
      "-frames:v",
      "1",
      "-compression_level",
      "1",
      "-f",
      "image2pipe",
      "-c:v",
      "png",
      "pipe:1",
    ],
    {
      stdin: Buffer.concat([
        data.subarray(0, afterHeader),
        cicp,
        data.subarray(afterHeader),
      ]),
      stdout: "pipe",
      stderr: "pipe",
    },
  );

  const [code, png, error] = await Promise.all([
    converter.exited,
    new Response(converter.stdout).bytes(),
    new Response(converter.stderr).text(),
  ]);

  if (code !== 0) throw new Error(error);

  return png;
};
