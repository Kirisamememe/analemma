import { applyTheme } from "@/preferences/apply-theme";
import { resolvePreferences } from "@/preferences/resolve-preferences";
import {
  LOCALE_STORAGE_KEY,
  THEME_STORAGE_KEY,
} from "@/preferences/storage-keys";

const { locale, theme } = resolvePreferences(
  {
    locale: localStorage.getItem(LOCALE_STORAGE_KEY),
    theme: localStorage.getItem(THEME_STORAGE_KEY),
  },
  navigator.languages,
);

document.documentElement.lang = locale;
applyTheme(theme);
