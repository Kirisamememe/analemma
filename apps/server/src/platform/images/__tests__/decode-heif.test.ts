import { describe, expect, test } from "bun:test";
import { readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname } from "node:path";
import sharp from "sharp";

import { decodeHeif } from "@/platform/images/decode-heif";

const PREFIX = "analemma-heif-";

const heicFixture = async (): Promise<Uint8Array> => {
  const response = await fetch(
    new URL("rotated-with-gps.heic", import.meta.url),
  );

  return new Uint8Array(await response.arrayBuffer());
};

const temporaryDirectories = async (): Promise<string[]> =>
  (await readdir(tmpdir())).filter((name) => name.startsWith(PREFIX));

describe("HEIC を PNG にする", () => {
  test("回転を当てた PNG の一時ファイルを書き、破棄すると消すこと", async () => {
    const decoded = await decodeHeif(await heicFixture(), "heic");
    const { format, width, height } = await sharp(decoded.path).metadata();

    expect([format, width, height]).toEqual(["png", 64, 96]);

    await decoded[Symbol.asyncDispose]();

    expect(await temporaryDirectories()).not.toContain(
      basename(dirname(decoded.path)),
    );
  });

  test("heif-dec が失敗しても、一時ファイルを残さないこと", async () => {
    const before = await temporaryDirectories();

    const failure: unknown = await decodeHeif(
      new TextEncoder().encode("not a heic"),
      "heic",
    ).catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(Error);
    expect(await temporaryDirectories()).toEqual(before);
  });
});

describe("ICC の無い AVIF を Display P3 に変換する", () => {
  test.each([
    {
      name: "p3-red",
      width: 16,
      first: [255, 0, 0, 128],
      last: [255, 0, 0, 128],
    },
    {
      name: "premultiplied-red",
      width: 16,
      first: [255, 0, 0, 128],
      last: [255, 0, 0, 128],
    },
    {
      name: "tiled-red-blue",
      width: 320,
      first: [255, 0, 0, 128],
      last: [0, 0, 255, 255],
    },
    { name: "srgb-red", width: 32, first: [234, 51, 35], last: [234, 51, 35] },
  ])(
    "$name の両端の色と透明度を保つこと",
    async ({ name, width, first, last }) => {
      const input = await fetch(
        new URL(`colors/${name}.avif`, import.meta.url),
      );

      await using result = await decodeHeif(
        new Uint8Array(await input.arrayBuffer()),
        "avif",
      );

      const { data, info } = await sharp(result.path, { ignoreIcc: true })
        .raw()
        .toBuffer({ resolveWithObject: true });

      expect(info.width).toBe(width);
      expect([...data.subarray(0, info.channels)]).toEqual(first);
      expect([...data.subarray(-info.channels)]).toEqual(last);
    },
  );
});
