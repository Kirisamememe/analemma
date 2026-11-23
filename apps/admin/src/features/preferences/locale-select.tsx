import type { ReactNode } from "react";

import { LOCALES, localeName } from "@/i18n/locales";
import { useChangeLocale } from "@/i18n/use-change-locale";
import { useLocale, useTranslate } from "@/i18n/use-translate";
import { NavSelect } from "@/ui/primitives/navigation";

const OPTIONS = LOCALES.map((locale) => ({
  value: locale,
  label: localeName(locale),
  lang: locale,
}));

/** ナビに置く、画面の言語の選択。 */
export const LocaleSelect = (): ReactNode => {
  const t = useTranslate();
  const locale = useLocale();
  const changeLocale = useChangeLocale();

  return (
    <NavSelect
      icon="languages"
      label={t("preferences.locale")}
      onChange={changeLocale}
      options={OPTIONS}
      value={locale}
    />
  );
};
