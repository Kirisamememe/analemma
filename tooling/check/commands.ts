import type { TestScope } from "./test-scope";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

/** bunfig.toml の中身から、`bun test` が外すパスのパターンを読む。 */
export const readIgnorePatterns = (bunfig: unknown): string[] => {
  const test = isRecord(bunfig) ? bunfig["test"] : undefined;
  const patterns = isRecord(test) ? test["pathIgnorePatterns"] : undefined;

  return Array.isArray(patterns)
    ? patterns.filter((pattern) => typeof pattern === "string")
    : [];
};

const testCommands = (
  scope: TestScope,
  ignorePatterns: readonly string[],
): string[][] =>
  scope === "all"
    ? [["bun", "run", "test"]]
    : [
        [
          "bun",
          "test",
          ...[...ignorePatterns, "apps/server/**"].map(
            (pattern) => `--path-ignore-patterns=${pattern}`,
          ),
        ],
        ["bun", "--cwd=apps/admin", "run", "test"],
      ];

/** check で順に流すコマンドを組み立てる。 */
export const buildCommands = (
  scope: TestScope,
  ignorePatterns: readonly string[],
): string[][] => [
  ["bun", "run", "format:check"],
  ["bun", "run", "lint"],
  ["bun", "run", "typecheck"],
  ...testCommands(scope, ignorePatterns),
];
