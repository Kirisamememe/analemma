import type { StorybookConfig } from "@storybook/react-vite";

import { adaptViteConfig } from "./adapt-vite-config.ts";
import { checkStoryCatalog, STORY_GLOB } from "./check-story-catalog.ts";

const config: StorybookConfig = {
  framework: "@storybook/react-vite",
  /** 検査した story をサイドバーの対象にする。 */
  stories: async () => {
    await checkStoryCatalog();
    return ["../src/" + STORY_GLOB];
  },
  addons: ["@storybook/addon-a11y"],
  core: { disableTelemetry: true },
  staticDirs: [{ from: "./sample-photos", to: "/media/samples" }],
  viteFinal: adaptViteConfig,
};

export default config;
