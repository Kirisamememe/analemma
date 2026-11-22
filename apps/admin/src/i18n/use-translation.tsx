import { use, useMemo } from "react";

import { LocaleContext } from "./locale-context";
import { createTranslate, type Translate } from "./translate";

/** 画面に出す言語で訳を引く関数を返す。 */
export const useTranslation = (): Translate => {
  const locale = use(LocaleContext);

  return useMemo(() => createTranslate(locale), [locale]);
};
