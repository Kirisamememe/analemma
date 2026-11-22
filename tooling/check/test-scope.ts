const SERVER_DIRECTORIES = ["apps/server/", "packages/"];
const SERVER_FILES = new Set(["compose.yaml"]);

/** 手元の check で流すテストの範囲。 */
export type TestScope = "all" | "without-server";

const touchesServer = (path: string): boolean =>
  SERVER_FILES.has(path) ||
  SERVER_DIRECTORIES.some((directory) => path.startsWith(directory));

/** 流すテストの範囲を決める材料。 */
type ScopeInput = {
  /** `--all` を付けたか。 */
  readonly all: boolean;
  /** 変えたファイル。 */
  readonly changedFiles: readonly string[] | undefined;
};

/** `--all` と変えたファイルから、流すテストの範囲を決める。 */
export const decideTestScope = ({ all, changedFiles }: ScopeInput): TestScope =>
  all ||
  changedFiles === undefined ||
  changedFiles.some((path) => touchesServer(path))
    ? "all"
    : "without-server";
