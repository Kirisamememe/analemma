import { isLocale, type Locale } from "@/i18n/locales";
import { negotiateLocale } from "@/i18n/negotiate-locale";
import { isTheme, type Theme } from "@/preferences/theme";

/** localStorage に置いてあった値(無ければ null)。 */
export type StoredPreferences = {
  /** 利用者が選んだ言語。 */
  readonly locale: string | null;
  /** 利用者が選んだ配色。 */
  readonly theme: string | null;
};

/** 最初の描画の前に当てる、言語と配色。 */
export type Preferences = {
  /** html の `lang` に入れる言語。 */
  readonly locale: Locale;
  /** html の `data-theme` に入れる配色。 */
  readonly theme: Theme;
};

/** 置いてあった値と、ブラウザの言語の並びから、当てる言語と配色を決める。 */
export const resolvePreferences = (
  stored: StoredPreferences,
  languages: readonly string[],
): Preferences => ({
  locale:
    stored.locale !== null && isLocale(stored.locale)
      ? stored.locale
      : negotiateLocale(languages),
  theme:
    stored.theme !== null && isTheme(stored.theme) ? stored.theme : "system",
});
