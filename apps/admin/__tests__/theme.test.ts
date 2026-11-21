import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const ADMIN_ROOT = fileURLToPath(new URL("../", import.meta.url));
const THEME = "src/ui/theme.css";

const sourceFiles = await Array.fromAsync(
  new Bun.Glob("src/**/*.{css,ts,tsx}").scan({ cwd: ADMIN_ROOT }),
);
const theme = await readFile(`${ADMIN_ROOT}${THEME}`, "utf8");

const namesOf = (prefix: string): string[] =>
  [
    ...theme.matchAll(new RegExp(`--${prefix}-(?<name>[a-z0-9\\-]+):`, "gv")),
  ].map(({ groups }) => groups?.["name"] ?? "");

describe("CSS の置き場所", () => {
  test("CSS のファイルは src/ui/ にだけ置く", () => {
    expect(
      sourceFiles.filter(
        (path) => path.endsWith(".css") && !path.startsWith("src/ui/"),
      ),
    ).toEqual([]);
  });

  test("パレットの変数は theme.css だけが読む", async () => {
    const readers = await Promise.all(
      sourceFiles
        .filter((path) => path !== THEME)
        .map(async (path) => ({
          path,
          text: await readFile(`${ADMIN_ROOT}${path}`, "utf8"),
        })),
    );

    expect(
      readers
        .filter(({ text }) => text.includes("--palette-"))
        .map(({ path }) => path),
    ).toEqual([]);
  });
});

describe("theme.css の名前", () => {
  test("色の名前と、文字の大きさの名前が重ならない", () => {
    const colors = new Set(namesOf("color"));

    expect(colors.size).toBeGreaterThan(0);
    expect(namesOf("text").filter((name) => colors.has(name))).toEqual([]);
  });

  test("文字の大きさと行間は、同じ名前の目盛り", () => {
    expect(namesOf("leading")).toEqual(namesOf("text"));
  });
});
