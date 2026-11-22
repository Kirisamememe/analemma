import type { Preview } from "@storybook/react-vite";

import { LOCALES, toLocale } from "../src/i18n/locales";
import "../src/ui/app.css";
import { Staged, StoryFrame } from "./story-frame";

const toStageWidth = (value: unknown): "fit" | "fill" | undefined =>
  value === "fit" || value === "fill" ? value : undefined;

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "配色",
      toolbar: {
        title: "配色",
        icon: "mirror",
        items: [
          { value: "light", title: "light" },
          { value: "dark", title: "dark" },
        ],
        dynamicTitle: true,
      },
    },
    locale: {
      description: "言語",
      toolbar: {
        title: "言語",
        icon: "globe",
        items: LOCALES.map((locale) => ({ value: locale, title: locale })),
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: "light", locale: "ja" },
  parameters: { contentLang: "ja", layout: "centered", stage: "fit" },
  decorators: [
    (
      Story,
      { globals: { locale, theme }, parameters: { contentLang, stage } },
    ) => (
      <StoryFrame
        contentLang={typeof contentLang === "string" ? contentLang : undefined}
        locale={toLocale(typeof locale === "string" ? locale : "")}
        theme={theme === "dark" ? "dark" : "light"}
      >
        <Staged width={toStageWidth(stage)}>
          <Story />
        </Staged>
      </StoryFrame>
    ),
  ],
};

export default preview;
