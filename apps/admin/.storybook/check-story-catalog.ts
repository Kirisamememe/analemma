import { glob } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { readCsf } from "storybook/internal/csf-tools";

import { checkStoryNames } from "./story-names.ts";

const SOURCE = fileURLToPath(new URL("../src/", import.meta.url));
export const STORY_GLOB = "**/__stories__/*.stories.{ts,tsx}";

/** Storybook と同じ CSF パーサーで、現在のファイルからサイドバーの名前を検査する。 */
export const checkStoryCatalog = async (): Promise<void> => {
  const paths = await Array.fromAsync(glob(STORY_GLOB, { cwd: SOURCE }));

  const files = await Promise.all(
    paths.toSorted().map(async (file) => {
      const csf = (
        await readCsf(join(SOURCE, file), { makeTitle: (title) => title })
      ).parse();

      return { file, title: csf.meta.title ?? "", stories: csf.indexInputs };
    }),
  );

  checkStoryNames(files);
};
