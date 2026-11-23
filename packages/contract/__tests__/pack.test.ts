import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { z } from "zod";

const manifestSchema = z.object({
  exports: z.record(
    z.string(),
    z.union([z.string(), z.record(z.string(), z.string())]),
  ),
});

/** `bun pm pack` で固めたものの中身。 */
type Packed = {
  /** 固めたものに入るファイルのパス(`package/` を除く)。 */
  readonly files: readonly string[];
  /** 固めたものの package.json。 */
  readonly manifest: z.infer<typeof manifestSchema>;
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

  if (manifest === undefined) {
    throw new Error("固めたものに package.json が無い。");
  }

  return {
    files: [...entries.keys()]
      .map((path) => path.replace(/^package\//v, ""))
      .toSorted(),
    manifest: manifestSchema.parse(await manifest.json()),
  };
};

const exportTargets = (
  exports: z.infer<typeof manifestSchema>["exports"],
): string[] =>
  Object.values(exports).flatMap((target) =>
    typeof target === "string" ? [target] : Object.values(target),
  );

const TYPESCRIPT_CONDITIONS = new Set(["types", "import", "default"]);

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
          path.replace(/^src\//v, "dist/types/").replace(/\.ts$/v, ".d.ts"),
        ),
      ].toSorted(),
    );
  });

  test("exports が指すファイルが、どれも入っていること", () => {
    const targets = exportTargets(packed.manifest.exports);

    expect(targets).not.toEqual([]);
    expect(
      targets
        .map((target) => target.replace(/^\.\//v, ""))
        .filter((path) => !packed.files.includes(path)),
    ).toEqual([]);
  });

  test("利用者の TypeScript が読む型が、dist の .d.ts であること", () => {
    const root = packed.manifest.exports["."];

    const target =
      typeof root === "string"
        ? root
        : Object.entries(root ?? {}).find(([condition]) =>
            TYPESCRIPT_CONDITIONS.has(condition),
          )?.[1];

    expect(target).toBe("./dist/types/index.d.ts");
  });
});
