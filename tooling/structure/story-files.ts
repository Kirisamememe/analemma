const STORY_DIRECTORY = "__stories__";

/** `__stories__` の中にある、story でないファイルを集める。 */
export const findStrayStoryFiles = (paths: readonly string[]): string[] =>
  paths
    .filter((path) => path.split("/").slice(0, -1).includes(STORY_DIRECTORY))
    .filter((path) => !path.endsWith(".stories.tsx"))
    .toSorted();
