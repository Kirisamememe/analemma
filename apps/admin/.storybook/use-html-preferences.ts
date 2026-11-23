import { useLayoutEffect } from "react";

import type { Theme } from "@/preferences/theme";

/** html に story の言語と配色を当てる。 */
export const useHtmlPreferences = (
  contentLang: string,
  theme: Exclude<Theme, "system">,
): void => {
  useLayoutEffect(() => {
    document.documentElement.lang = contentLang;
    document.documentElement.dataset["theme"] = theme;
  }, [contentLang, theme]);
};
