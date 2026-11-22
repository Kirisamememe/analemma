import { afterEach, describe, expect, test } from "bun:test";

import { createI18n } from "../../i18n/create-i18n";
import type { Locale } from "../../i18n/locales";
import { LOCALE_STORAGE_KEY } from "../storage-keys";
import { syncLocale } from "../sync-locale";

const setUp = (locale: Locale) => {
  const i18n = createI18n(locale);

  document.documentElement.lang = locale;
  syncLocale(i18n);

  return i18n;
};

afterEach(() => {
  document.documentElement.lang = "";
  localStorage.clear();
});

describe("syncLocale", () => {
  test("切り替えた言語を、html の lang に入れ、利用者が選んだ言語として置く", async () => {
    await setUp("en").changeLanguage("zh-Hans");

    expect(document.documentElement.lang).toBe("zh-Hans");
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("zh-Hans");
  });

  test("対応していない言語に切り替えたら、英語を入れて置く", async () => {
    await setUp("ja").changeLanguage("fr");

    expect(document.documentElement.lang).toBe("en");
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("en");
  });

  test("切り替えていなければ、ブラウザの言語から選んだ言語を置かない", () => {
    setUp("ja");

    expect(document.documentElement.lang).toBe("ja");
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBeNull();
  });
});
