/** 対応する言語の、BCP 47 の tag。 */
export const LOCALES = ["en", "ja", "zh-Hans"] as const;

/** 対応する言語。 */
export type Locale = (typeof LOCALES)[number];

/** 利用者の言語に対応していないときと、訳が無いときに使う言語。 */
export const FALLBACK_LOCALE: Locale = "en";

const SUPPORTED: ReadonlySet<string> = new Set(LOCALES);

/** 値が、対応する言語の tag かを返す。 */
export const isLocale = (value: string): value is Locale =>
  SUPPORTED.has(value);

/** html の `lang` の値を、対応する言語にする。 */
export const toLocale = (lang: string): Locale =>
  isLocale(lang) ? lang : FALLBACK_LOCALE;

const REGIONAL_LOCALES: Readonly<Record<Locale, string>> = {
  en: "en-US",
  ja: "ja-JP",
  "zh-Hans": "zh-CN",
};

/** html の `lang` の値を、部品が辞書を引く、地域を付けた言語にする。 */
export const toRegionalLocale = (lang: string): string =>
  REGIONAL_LOCALES[toLocale(lang)];

/** 言語の、その言語で書いた名前(English・日本語・简体中文)。 */
export const localeName = (locale: Locale): string =>
  new Intl.DisplayNames([locale], {
    type: "language",
    languageDisplay: "dialect",
  }).of(locale) ?? locale;
