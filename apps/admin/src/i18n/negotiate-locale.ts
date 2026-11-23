import { FALLBACK_LOCALE, LOCALES, type Locale } from "@/i18n/locales";

/** 言語と文字体系の組。 */
type Script = {
  /** ISO 639 の言語。 */
  readonly language: string;
  /** ISO 15924 の文字体系。 */
  readonly script: string | undefined;
};

const toScript = (tag: string): Script | undefined => {
  try {
    const { language, script } = new Intl.Locale(tag).maximize();

    return { language, script };
  } catch {
    return undefined;
  }
};

const SUPPORTED = LOCALES.map((locale) => ({
  locale,
  script: toScript(locale),
}));

const match = (tag: string): Locale | undefined => {
  const requested = toScript(tag);

  return requested === undefined
    ? undefined
    : SUPPORTED.find(
        ({ script }) =>
          script?.language === requested.language &&
          script.script === requested.script,
      )?.locale;
};

/** 利用者が望む言語の並びから、対応する言語を選ぶ。 */
export const negotiateLocale = (requested: readonly string[]): Locale => {
  for (const tag of requested) {
    const locale = match(tag);

    if (locale !== undefined) {
      return locale;
    }
  }

  return FALLBACK_LOCALE;
};
