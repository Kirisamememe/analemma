import type { StorybookConfig } from "@storybook/react-vite";

import { adaptViteConfig } from "./adapt-vite-config.ts";

const config: StorybookConfig = {
  framework: "@storybook/react-vite",
  stories: ["../src/**/__stories__/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-a11y"],
  core: { disableTelemetry: true },
  staticDirs: [{ from: "./sample-photos", to: "/media/samples" }],
  viteFinal: adaptViteConfig,
};

export default config;
