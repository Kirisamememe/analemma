import { withoutVitePlugins } from "@storybook/builder-vite";
import type { StorybookConfig } from "@storybook/react-vite";

import { BOOT_SCRIPT_PLUGIN, BROWSER_TARGET } from "../vite.config.ts";

const config: StorybookConfig = {
  framework: "@storybook/react-vite",
  stories: ["../src/**/__stories__/*.stories.tsx"],
  addons: ["@storybook/addon-a11y"],
  core: { disableTelemetry: true },
  /** 管理画面の CSS の対象を入れ直し、head の script を外す。 */
  viteFinal: async (viteConfig) => ({
    ...viteConfig,
    plugins: await withoutVitePlugins(viteConfig.plugins, [BOOT_SCRIPT_PLUGIN]),
    build: {
      ...viteConfig.build,
      target: BROWSER_TARGET,
      cssTarget: BROWSER_TARGET,
    },
  }),
};

export default config;
