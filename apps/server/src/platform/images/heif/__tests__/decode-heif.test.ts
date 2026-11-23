import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { mkdtempDisposable, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import sharp from "sharp";

import { decodeHeif } from "@/platform/images/heif/decode-heif";

const heicFixture = async (): Promise<Uint8Array> => {
  const response = await fetch(
    new URL("../../__tests__/rotated-with-gps.heic", import.meta.url),
  );

  return new Uint8Array(await response.arrayBuffer());
};

describe("HEIC を PNG にする", () => {
  test("回転を当てた PNG の一時ファイルを書き、破棄すると消すこと", async () => {
    const decoded = await decodeHeif(await heicFixture(), "heic");
    const { format, width, height } = await sharp(decoded.path).metadata();

    expect([format, width, height]).toEqual(["png", 64, 96]);

    await decoded[Symbol.asyncDispose]();

    expect(existsSync(dirname(decoded.path))).toBe(false);
  });

  test.each(["入力を読めない", "出力を書けない"])(
    "%sときは、失敗を返して一時ファイルを消すこと",
    async (failure) => {
      await using root = await mkdtempDisposable(
        join(tmpdir(), "analemma-test-"),
      );

      if (failure === "出力を書けない") {
        const heif = Bun.which("heif-dec");

        if (heif === null) throw new Error("heif-dec が必要");

        await writeFile(
          join(root.path, "heif-dec"),
          `#!/bin/sh\nexec "${heif}" --quiet "$4" "$5/missing.png"\n`,
          { mode: 0o755 },
        );
      }

      const result = Bun.spawnSync(
        [
          process.execPath,
          "-e",
          `import { decodeHeif } from "../decode-heif.ts";
           const input = new Uint8Array(await Bun.file(process.argv[1]).arrayBuffer());
           await using decoded = await decodeHeif(input, "heic");`,
          failure === "出力を書けない"
            ? "../../__tests__/rotated-with-gps.heic"
            : "decode-heif.test.ts",
        ],
        {
          cwd: import.meta.dirname,
          env: {
            ...Bun.env,
            TMPDIR: root.path,
            PATH: `${root.path}:${Bun.env["PATH"]}`,
          },
        },
      );

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr.toString()).toContain(
        failure === "出力を書けない" ? "could not write image" : "heif-dec",
      );
      expect(
        (await readdir(root.path)).filter((name) =>
          name.startsWith("analemma-heif-"),
        ),
      ).toEqual([]);
    },
  );
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
      const input = await fetch(new URL(`./${name}.avif`, import.meta.url));

      await using result = await decodeHeif(
        new Uint8Array(await input.arrayBuffer()),
        "avif",
      );

      expect((await sharp(result.path).metadata()).bitsPerSample).toBe(16);

      const { data, info } = await sharp(result.path, { ignoreIcc: true })
        .withIccProfile("p3")
        .raw()
        .toBuffer({ resolveWithObject: true });

      expect(info.width).toBe(width);
      expect([...data.subarray(0, info.channels)]).toEqual([...first]);
      expect([...data.subarray(-info.channels)]).toEqual([...last]);
    },
  );
});
