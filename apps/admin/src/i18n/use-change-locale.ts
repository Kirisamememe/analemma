import { useTranslation } from "react-i18next";

import type { Locale } from "@/i18n/locales";

/** 画面の言語を切り替える関数を返す(読み込み直さずに、訳をその場で替える)。 */
export const useChangeLocale = (): ((locale: Locale) => void) => {
  const { i18n } = useTranslation();

  return (locale) => {
    void i18n.changeLanguage(locale);
  };
};
