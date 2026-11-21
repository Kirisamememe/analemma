import { createContext } from "react";

import { FALLBACK_LOCALE, type Locale } from "./locales";

/** 画面に出す言語。 */
export const LocaleContext = createContext<Locale>(FALLBACK_LOCALE);
