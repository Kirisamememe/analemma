import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { createI18n } from "@/i18n/create-i18n";
import { useChangeLocale } from "@/i18n/use-change-locale";
import { useTranslate } from "@/i18n/use-translate";
import { withI18n } from "@/testing/render-with-i18n";

afterEach(cleanup);

describe("useChangeLocale", () => {
  test("選んだ言語に切り替え、訳を引く部品を、その言語で描き直す", () => {
    const i18n = createI18n("ja");

    const { result } = renderHook(
      () => ({ changeLocale: useChangeLocale(), t: useTranslate() }),
      { wrapper: withI18n(i18n) },
    );

    expect(result.current.t("home.title")).toBe("ホーム");

    act(() => {
      result.current.changeLocale("zh-Hans");
    });

    expect(i18n.language).toBe("zh-Hans");
    expect(result.current.t("home.title")).toBe("首页");
  });
});
