import { useSyncExternalStore } from "react";

import { applyTheme } from "@/preferences/apply-theme";
import { THEME_STORAGE_KEY } from "@/preferences/storage-keys";
import { type Theme, toTheme } from "@/preferences/theme";

const subscribe = (onChange: () => void): (() => void) => {
  const observer = new MutationObserver(onChange);

  observer.observe(document.documentElement, {
    attributeFilter: ["data-theme"],
  });

  return () => {
    observer.disconnect();
  };
};

const readTheme = (): Theme =>
  toTheme(document.documentElement.dataset["theme"]);

const changeTheme = (theme: Theme): void => {
  applyTheme(theme);
  localStorage.setItem(THEME_STORAGE_KEY, theme);
};

/** 今の配色と、選んだ配色を当てて次に開いたときのために置く関数。 */
type ThemeState = {
  /** html の `data-theme` が示す、今の配色。 */
  readonly theme: Theme;
  /** 配色を html に当て、localStorage に置く。 */
  readonly changeTheme: (theme: Theme) => void;
};

/** 今の配色と、配色を切り替える関数を返す。 */
export const useTheme = (): ThemeState => ({
  theme: useSyncExternalStore(subscribe, readTheme),
  changeTheme,
});
