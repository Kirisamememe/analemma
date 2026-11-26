import { withoutVitePlugins } from "@storybook/builder-vite";
import type { InlineConfig, Plugin } from "vite";

import { BOOT_SCRIPT_PLUGIN, BROWSER_TARGET } from "../vite.config.ts";
import { checkStoryCatalog } from "./check-story-catalog.ts";

const checkStoryChanges: Plugin = {
  name: "check-story-names",
  async hotUpdate({ file }) {
    if (/\.stories\.tsx?$/v.test(file)) await checkStoryCatalog();
  },
};

/** Storybook の Vite の設定に、管理画面のビルドの対象を入れ直し、head の script を外す。 */
export const adaptViteConfig = async (
  viteConfig: InlineConfig,
): Promise<InlineConfig> => ({
  ...viteConfig,
  plugins: [
    ...(await withoutVitePlugins(viteConfig.plugins, [BOOT_SCRIPT_PLUGIN])),
    checkStoryChanges,
  ],
  build: {
    ...viteConfig.build,
    target: BROWSER_TARGET,
    cssTarget: BROWSER_TARGET,
  },
});
