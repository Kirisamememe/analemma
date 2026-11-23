/** 1つのフォルダに置けるファイルとフォルダの数。 */
export const DIRECTORY_ENTRY_LIMIT = 10;

const UNCOUNTED_ENTRIES = new Set([
  "AGENTS.md",
  "CLAUDE.md",
  "DECISIONS.md",
  "README.md",
  "__tests__",
  "__stories__",
]);

const SIDE_DIRECTORIES = new Set(["__tests__", "__stories__"]);

/** story を置けるフォルダ(この下の `__stories__` だけを認める)。 */
export const STORY_ROOT = "apps/admin/src/";

const DIRECTORY_NAME = /^(?:[a-z0-9]+(?:-[a-z0-9]+)*|__tests__|__stories__)$/v;

/** 生成物を置くので、名前と数を検査しないフォルダ。 */
export const GENERATED_DIRECTORIES = ["apps/server/src/db/migrations"];

/** 中身が多すぎるフォルダと、その中身の数。 */
export type CrowdedDirectory = {
  /** リポジトリの直下から数えたフォルダのパス。 */
  readonly directory: string;
  /** 数えた中身の数。 */
  readonly entries: number;
};

/** フォルダを調べるための入力。 */
export type DirectoryCheckInput = {
  /** リポジトリの直下から数えた、全ファイルのパス。 */
  readonly paths: readonly string[];
  /** 1つのフォルダに置ける数。 */
  readonly limit: number;
};

const isGenerated = (directory: string): boolean =>
  GENERATED_DIRECTORIES.some(
    (generated) =>
      directory === generated || directory.startsWith(`${generated}/`),
  );

const isChecked = (directory: string): boolean =>
  directory !== "" &&
  !directory.split("/").some((segment) => segment.startsWith(".")) &&
  !isGenerated(directory);

const childrenByDirectory = (
  paths: readonly string[],
): Map<string, Set<string>> => {
  const children = new Map<string, Set<string>>();

  for (const path of paths) {
    const segments = path.split("/");

    for (const [index, segment] of segments.entries()) {
      const parent = segments.slice(0, index).join("/");
      const entries = children.get(parent) ?? new Set<string>();

      entries.add(segment);
      children.set(parent, entries);
    }
  }

  return children;
};

/** 数えるべき中身が多すぎるフォルダを集める。 */
export const findCrowdedDirectories = ({
  limit,
  paths,
}: DirectoryCheckInput): CrowdedDirectory[] =>
  [...childrenByDirectory(paths)]
    .filter(([directory]) => isChecked(directory))
    .map(([directory, entries]) => ({
      directory,
      entries: [...entries].filter((entry) => !UNCOUNTED_ENTRIES.has(entry))
        .length,
    }))
    .filter(({ entries }) => entries > limit)
    .toSorted((left, right) => (left.directory < right.directory ? -1 : 1));

const isBadDirectory = (directory: string): boolean => {
  const segments = directory.split("/");

  const nestedInSide = segments
    .slice(0, -1)
    .some((segment) => SIDE_DIRECTORIES.has(segment));

  const name = segments.at(-1) ?? "";

  const strayStories =
    name === "__stories__" && !directory.startsWith(STORY_ROOT);

  return nestedInSide || strayStories || !DIRECTORY_NAME.test(name);
};

/** 名前の決まりに合わないフォルダと、__tests__・__stories__ の中のフォルダを集める。 */
export const findBadDirectories = (paths: readonly string[]): string[] =>
  [...childrenByDirectory(paths).keys()]
    .filter((directory) => isChecked(directory))
    .filter((directory) => isBadDirectory(directory))
    .toSorted();
