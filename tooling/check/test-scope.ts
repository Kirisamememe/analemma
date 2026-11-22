const SERVER_DIRECTORIES = ["apps/server/", "packages/"];
const SERVER_FILES = new Set(["compose.yaml"]);

/** 手元の check で流すテストの範囲。 */
export type TestScope = "all" | "without-server";

const touchesServer = (path: string): boolean =>
  SERVER_FILES.has(path) ||
  SERVER_DIRECTORIES.some((directory) => path.startsWith(directory));

/** 変えたファイルから、流すテストの範囲を決める。 */
export const decideTestScope = (
  changedFiles: readonly string[] | undefined,
): TestScope =>
  changedFiles === undefined || changedFiles.some((path) => touchesServer(path))
    ? "all"
    : "without-server";
