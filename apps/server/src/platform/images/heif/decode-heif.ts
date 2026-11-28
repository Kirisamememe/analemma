import { access, mkdtempDisposable, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp, { type Sharp } from "sharp";
import { z } from "zod";

/** 外のコマンドが書き出した文字列。 */
type CommandOutput = {
  /** 標準出力。 */
  readonly stdout: string;
  /** 標準エラー出力。 */
  readonly stderr: string;
};

const run = async (
  command: string,
  args: readonly string[],
): Promise<CommandOutput> => {
  const child = Bun.spawn([command, ...args], {
    stdout: "pipe",
    stderr: "pipe",
  });

  const [code, stdout, stderr] = await Promise.all([
    child.exited,
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
  ]);

  if (code !== 0) throw new Error(`${command}: ${stderr}`);

  return { stdout, stderr };
};

const videoStream = z.object({
  color_primaries: z.string().optional(),
  color_transfer: z.string().optional(),
});

const disposition = z.object({ default: z.number() });

const probeOutput = z.object({
  streams: z.array(videoStream.extend({ disposition })),
  stream_groups: z
    .array(z.object({ disposition, streams: z.array(videoStream) }))
    .optional(),
});

const readPixels = async (bytes: Uint8Array, input: string): Promise<Sharp> => {
  const image = sharp(bytes);
  const { width, height, hasAlpha } = await image.metadata();

  if (!hasAlpha) return image;

  const { stdout: info } = await run("heif-info", [input]);

  const primary = info
    .split("\nimage: ")
    .find((item) => item.split("\n", 1)[0]?.endsWith(", primary") === true);

  if (primary?.includes("\n  alpha channel: yes (premultiplied)") !== true) {
    return image;
  }

  return sharp({
    create: { width, height, channels: 4, background: "transparent" },
  })
    .pipelineColourspace("rgb16")
    .composite([
      {
        input: Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength),
        blend: "source",
        premultiplied: true,
      },
    ]);
};

/** HEIF から作った PNG の一時ファイル。 */
export type DecodedHeif = AsyncDisposable & {
  /** PNG のパス。 */
  readonly path: string;
};

/** HEIC と ICC の無い AVIF を PNG の一時ファイルにする。 */
export const decodeHeif = async (
  bytes: Uint8Array,
  format: "heic" | "avif",
): Promise<DecodedHeif> => {
  await using stack = new AsyncDisposableStack();

  const directory = stack.use(
    await mkdtempDisposable(join(tmpdir(), "analemma-heif-")),
  );

  const input = join(directory.path, `input.${format}`);
  const output = join(directory.path, "decoded.png");

  await writeFile(input, bytes);

  if (format === "heic") {
    const { stderr } = await run("heif-dec", [
      "--quiet",
      "--png-compression-level",
      "1",
      input,
      output,
    ]);

    if (stderr.includes("could not write image")) {
      throw new Error(stderr.trim());
    }

    await access(output);
  } else {
    const { stdout: metadata } = await run("ffprobe", [
      "-v",
      "error",
      "-f",
      "mov",
      "-select_streams",
      "v",
      "-show_entries",
      "stream=color_primaries,color_transfer:stream_disposition=default:stream_group_disposition=default",
      "-of",
      "json",
      input,
    ]);

    const probe = probeOutput.parse(JSON.parse(metadata));

    const primary =
      probe.streams.find((stream) => stream.disposition.default === 1) ??
      probe.stream_groups?.find((group) => group.disposition.default === 1)
        ?.streams[0] ??
      probe.streams[0];

    const primaries = primary?.color_primaries ?? "bt709";
    const transfer = primary?.color_transfer ?? "iec61966-2-1";
    const rgb = join(directory.path, "rgb.png");

    const image = await readPixels(bytes, input);

    const { channels } = await image
      .toColourspace("rgb16")
      .png({ compressionLevel: 0 })
      .toFile(rgb);

    await run("ffmpeg", [
      "-v",
      "error",
      "-nostdin",
      "-i",
      rgb,
      "-vf",
      `scale=in_primaries=${primaries}:in_transfer=${transfer}:out_primaries=smpte432:out_transfer=iec61966-2-1`,
      "-pix_fmt",
      channels === 4 ? "rgba64be" : "rgb48be",
      "-compression_level",
      "1",
      "-update",
      "1",
      output,
    ]);
  }

  const owned = stack.move();

  return {
    path: output,
    [Symbol.asyncDispose]: async () => owned.disposeAsync(),
  };
};
