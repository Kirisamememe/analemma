import type { StoryIndexGenerator } from "storybook/internal/core-server";

import { checkStoryNames } from "./story-names.ts";

/** サイドバーに返す index にも、CSF と同じ命名規則を適用する。 */
export const withCheckedStoryIndex = <
  T extends Pick<StoryIndexGenerator, "getIndex">,
>(
  generator: T,
): T => {
  const getIndex = async () => {
    const index = await generator.getIndex();

    const files = Object.values(index.entries).flatMap((entry) => {
      if (entry.type !== "story") return [];

      return [
        {
          file: entry.importPath.replace(/^\.\/src\//v, ""),
          title: entry.title,
          stories: [{ exportName: entry.exportName ?? "", name: entry.name }],
        },
      ];
    });

    checkStoryNames(files);

    return index;
  };

  return new Proxy(generator, {
    get(target, property): unknown {
      return property === "getIndex" ? getIndex : Reflect.get(target, property);
    },
  });
};
