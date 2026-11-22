import { withoutVitePlugins } from "@storybook/builder-vite";
import type { InlineConfig } from "vite";

import { BOOT_SCRIPT_PLUGIN, BROWSER_TARGET } from "../vite.config.ts";

/** Storybook の Vite の設定に、管理画面のビルドの対象を入れ直し、head の script を外す。 */
export const adaptViteConfig = async (
  viteConfig: InlineConfig,
): Promise<InlineConfig> => ({
  ...viteConfig,
  plugins: await withoutVitePlugins(viteConfig.plugins, [BOOT_SCRIPT_PLUGIN]),
  build: {
    ...viteConfig.build,
    target: BROWSER_TARGET,
    cssTarget: BROWSER_TARGET,
  },
});
