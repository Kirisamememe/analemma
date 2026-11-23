import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** `bun pm pack` で固めたものの中身。 */
type Packed = {
  /** 固めたものに入るファイルのパス(`package/` を除く)。 */
  readonly files: readonly string[];
  /** 固めたものの package.json。 */
  readonly manifest: unknown;
};

const packageRoot = join(import.meta.dirname, "..");
const destination = mkdtempSync(join(tmpdir(), "analemma-contract-pack-"));

const pack = async (): Promise<Packed> => {
  const child = Bun.spawn(
    [process.execPath, "pm", "pack", "--quiet", "--destination", destination],
    { cwd: packageRoot, stdout: "pipe", stderr: "pipe" },
  );

  const [stderr, status] = await Promise.all([
    new Response(child.stderr).text(),
    child.exited,
  ]);

  if (status !== 0) {
    throw new Error(`bun pm pack が失敗した(${status})。\n${stderr}`);
  }

  const [tarball] = [...new Bun.Glob("*.tgz").scanSync(destination)];

  if (tarball === undefined) {
    throw new Error("bun pm pack が .tgz を書き出していない。");
  }

  const entries = await new Bun.Archive(
    await Bun.file(join(destination, tarball)).bytes(),
  ).files();

  const manifest = entries.get("package/package.json");

  return {
    files: [...entries.keys()]
      .map((path) => path.replace(/^package\//v, ""))
      .toSorted(),
    manifest: manifest === undefined ? undefined : await manifest.json(),
  };
};

const fieldOf = (value: unknown, key: string): unknown =>
  typeof value === "object" && value !== null && key in value
    ? Object.entries(value).find(([name]) => name === key)?.[1]
    : undefined;

const stringsIn = (value: unknown): string[] =>
  typeof value === "string"
    ? [value]
    : typeof value === "object" && value !== null
      ? Object.values(value).flatMap((item) => stringsIn(item))
      : [];

const sources = [...new Bun.Glob("src/**/*.ts").scanSync(packageRoot)].filter(
  (path) => !path.includes("/__tests__/"),
);

let packed: Packed;

beforeAll(async () => {
  packed = await pack();
}, 60_000);

afterAll(() => {
  rmSync(destination, { recursive: true, force: true });
});

describe("contract を固めたもの", () => {
  test("テストを除いたソースと、ソースごとの型の宣言と、README と package.json だけが入ること", () => {
    expect(packed.files).toEqual(
      [
        "README.md",
        "package.json",
        ...sources,
        ...sources.map((path) =>
          path.replace(/^src\//v, "dist/").replace(/\.ts$/v, ".d.ts"),
        ),
      ].toSorted(),
    );
  });

  test("exports の条件が指すファイルが、どれも入っていること", () => {
    const targets = stringsIn(fieldOf(packed.manifest, "exports"));

    expect(targets).not.toEqual([]);
    expect(
      targets
        .map((target) => target.replace(/^\.\//v, ""))
        .filter((path) => !packed.files.includes(path)),
    ).toEqual([]);
  });
});
