import { FALLBACK_LOCALE, isLocale, type Locale } from "./locales";

/** html の `lang` の値を、管理画面が持つ言語にする。 */
export const toLocale = (lang: string): Locale =>
  isLocale(lang) ? lang : FALLBACK_LOCALE;
