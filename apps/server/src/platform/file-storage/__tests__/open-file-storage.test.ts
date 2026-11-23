import { afterAll, describe, expect, test } from "bun:test";
import { mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { openFileStorage } from "@/platform/file-storage/open-file-storage";

const parent = await mkdtemp(join(tmpdir(), "analemma-file-storage-"));

afterAll(async () => {
  await rm(parent, { recursive: true, force: true });
});

const openEmpty = async () => {
  const directory = await mkdtemp(join(parent, "storage-"));

  return { directory, storage: await openFileStorage(directory) };
};

const bytesOf = async (blob: Blob | undefined): Promise<number[]> =>
  blob === undefined ? [] : [...(await blob.bytes())];

describe("ファイルの置き場所", () => {
  test("書いたファイルを同じ名前で読め、同じ名前で書くと置き換わり、フォルダを含む名前ではフォルダを作ること", async () => {
    const { storage } = await openEmpty();

    await storage.write("a-640.avif", new Uint8Array([1, 2, 3]));
    await storage.write("a-640.avif", new Uint8Array([4, 5]));
    await storage.write("b/c_1.avif", new Uint8Array([6]));

    expect(await bytesOf(await storage.read("a-640.avif"))).toEqual([4, 5]);
    expect(await bytesOf(await storage.read("b/c_1.avif"))).toEqual([6]);
  });

  test("無いファイルは undefined を返し、消すときは無いファイルを飛ばすこと", async () => {
    const { directory, storage } = await openEmpty();

    await storage.write("a-640.avif", new Uint8Array([1]));
    await storage.write("a-1280.avif", new Uint8Array([2]));
    await storage.remove(["a-640.avif", "missing.avif"]);

    expect(await storage.read("a-640.avif")).toBeUndefined();
    expect(await storage.read("missing.avif")).toBeUndefined();
    expect(await readdir(directory)).toEqual(["a-1280.avif"]);
  });

  test.each([
    "../outside.avif",
    "a/../../outside.avif",
    "/etc/passwd",
    "a\\b.avif",
    "a//b.avif",
    ".hidden.avif",
    "a.b.avif",
    "A.avif",
    "a",
    "",
  ])(
    "%p は、読む・書く・消すのどれでも、置き場所の内にも外にも触れずに失敗すること",
    async (key) => {
      const { directory, storage } = await openEmpty();

      await writeFile(join(parent, "outside.avif"), "outside");
      await storage.write("kept.avif", new Uint8Array([1]));

      expect(storage.write(key, new Uint8Array([1]))).rejects.toThrow(
        "置き場所のファイルの名前に使えない",
      );
      expect(storage.read(key)).rejects.toThrow(
        "置き場所のファイルの名前に使えない",
      );
      expect(storage.remove(["kept.avif", key])).rejects.toThrow(
        "置き場所のファイルの名前に使えない",
      );
      expect(await readdir(directory)).toEqual(["kept.avif"]);
      expect(await readdir(parent)).toContain("outside.avif");
    },
  );

  test("フォルダが無いか、フォルダでなければ、開けないこと", async () => {
    const file = join(parent, "file.txt");

    await writeFile(file, "file");

    expect(openFileStorage(join(parent, "missing"))).rejects.toThrow();
    expect(openFileStorage(file)).rejects.toThrow("フォルダではない");
  });
});
