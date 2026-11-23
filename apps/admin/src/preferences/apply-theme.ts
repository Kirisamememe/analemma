import type { Theme } from "@/preferences/theme";

/** html の `data-theme` に配色を当てる(自動なら外す)。 */
export const applyTheme = (theme: Theme): void => {
  const { dataset } = document.documentElement;

  if (theme === "system") {
    delete dataset["theme"];

    return;
  }

  dataset["theme"] = theme;
};
