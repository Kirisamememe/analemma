import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { z } from "zod";

const exportsSchema = z.record(
  z.string(),
  z.union([z.string(), z.record(z.string(), z.string())]),
);

const manifestSchema = z.object({
  exports: exportsSchema,
  bin: z.record(z.string(), z.string()),
  dependencies: z.record(z.string(), z.string()),
});

/** `bun pm pack` で固めたものの中身。 */
type Packed = {
  /** 固めたものに入るファイルのパス(`package/` を除く)。 */
  readonly files: readonly string[];
  /** 固めたものの package.json。 */
  readonly manifest: z.infer<typeof manifestSchema>;
};

const packageRoot = join(import.meta.dirname, "..");
const contractRoot = join(packageRoot, "../contract");
const contractDeclarations = join(contractRoot, "dist/types");
const contractTarball = join(contractRoot, "dist/pack-test.tgz");
const STALE_DECLARATION = "export declare const stale: true;\n";
const destination = mkdtempSync(join(tmpdir(), "analemma-client-pack-"));

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

const filesIn = (root: string, pattern: string): string[] =>
  [...new Bun.Glob(pattern).scanSync(root)].toSorted();

const sdkSources = [
  ...new Bun.Glob("src/**/*.ts").scanSync(packageRoot),
].filter(
  (path) => !path.includes("/__tests__/") && !path.startsWith("src/cli/"),
);

let packed: Packed;

beforeAll(async () => {
  mkdirSync(contractDeclarations, { recursive: true });
  writeFileSync(join(contractDeclarations, "index.d.ts"), STALE_DECLARATION);
  writeFileSync(join(contractDeclarations, "removed.d.ts"), STALE_DECLARATION);
  writeFileSync(contractTarball, "");
  packed = await pack();
}, 60_000);

afterAll(() => {
  rmSync(destination, { recursive: true, force: true });
  rmSync(contractTarball, { force: true });
});

describe("client を固めたもの", () => {
  test("build した SDK と CLI と、SDK のソースごとの型の宣言と、README と package.json だけが入ること", () => {
    expect(packed.files).toEqual(
      [
        "README.md",
        "package.json",
        "dist/index.js",
        "dist/cli/main.js",
        ...sdkSources.map((path) =>
          path.replace(/^src\//v, "dist/").replace(/\.ts$/v, ".d.ts"),
        ),
      ].toSorted(),
    );
  });

  test("exports と bin が指すファイルが、どれも入っていること", () => {
    const targets = [
      ...exportTargets(packed.manifest.exports),
      ...Object.values(packed.manifest.bin),
    ];

    expect(targets).not.toEqual([]);
    expect(
      targets
        .map((target) => target.replace(/^\.\//v, ""))
        .filter((path) => !packed.files.includes(path)),
    ).toEqual([]);
  });

  test("contract への依存を、workspace の指定でなく、contract の version で書くこと", async () => {
    const contract = z
      .object({ version: z.string() })
      .parse(await Bun.file(join(contractRoot, "package.json")).json());

    expect(packed.manifest.dependencies["@analemma/contract"]).toBe(
      contract.version,
    );
    expect(
      Object.values(packed.manifest.dependencies).filter((version) =>
        version.startsWith("workspace:"),
      ),
    ).toEqual([]);
  });

  test("client を build すると、contract の型の宣言を、今のソースから作り直すこと", async () => {
    expect(filesIn(contractDeclarations, "**/*.d.ts")).toEqual(
      filesIn(contractRoot, "src/**/*.ts")
        .filter((path) => !path.includes("/__tests__/"))
        .map((path) => path.replace(/^src\//v, "").replace(/\.ts$/v, ".d.ts"))
        .toSorted(),
    );
    expect(
      await Bun.file(join(contractDeclarations, "index.d.ts")).text(),
    ).not.toBe(STALE_DECLARATION);
  });

  test("client を build しても、contract の dist に固めた .tgz を消さないこと", () => {
    expect(existsSync(contractTarball)).toBe(true);
  });
});
