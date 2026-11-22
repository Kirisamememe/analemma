import { createInstance, type i18n as I18n } from "i18next";

import { FALLBACK_LOCALE, LOCALES, type Locale } from "./locales";
import { RESOURCES } from "./resources";

/** 訳を読み込み終えた i18next の instance を、言語を決めて作る。 */
export const createI18n = (locale: Locale): I18n => {
  const i18n = createInstance();

  void i18n.init({
    lng: locale,
    fallbackLng: FALLBACK_LOCALE,
    supportedLngs: LOCALES,
    resources: structuredClone(RESOURCES),
    keySeparator: false,
    nsSeparator: false,
    interpolation: { escapeValue: false },
  });

  return i18n;
};
