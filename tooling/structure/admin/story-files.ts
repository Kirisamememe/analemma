const STORY_DIRECTORY = "__stories__";

const STORY_ROOT = "apps/admin/src/";

const STORY_FILE = /\.stories\.tsx?$/v;

const isInStories = (path: string): boolean =>
  path.split("/").at(-2) === STORY_DIRECTORY;

/** `__stories__` の中の story でないファイルと、決めた場所の外の story を集める。 */
export const findStrayStoryFiles = (paths: readonly string[]): string[] =>
  paths
    .filter((path) =>
      STORY_FILE.test(path)
        ? !(path.startsWith(STORY_ROOT) && isInStories(path))
        : path.split("/").slice(0, -1).includes(STORY_DIRECTORY),
    )
    .toSorted();
