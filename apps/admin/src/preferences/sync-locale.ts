import type { i18n as I18n } from "i18next";

import { LOCALE_STORAGE_KEY } from "./storage-keys";

/** i18next の言語の切り替えに、html の `lang` と localStorage をそろえる。 */
export const syncLocale = (i18n: I18n): void => {
  i18n.on("languageChanged", (locale) => {
    document.documentElement.lang = locale;
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  });
};
