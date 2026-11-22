import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { withI18n } from "../../testing/render-with-i18n";
import { createI18n } from "../create-i18n";
import type { Locale } from "../locales";
import { type MessageKey, useLocale, useTranslate } from "../use-translate";

afterEach(cleanup);

describe("useTranslate", () => {
  test("今の言語で訳と引数を表示し、言語が変わったら描き直す", async () => {
    const i18n = createI18n("en");
    const { result } = renderHook(
      () => {
        const t = useTranslate();
        const title: MessageKey = "notFound.title";

        return [t(title), t("passkeys.deleteTitle", { name: "MacBook" })];
      },
      { wrapper: withI18n(i18n) },
    );

    expect(result.current).toEqual(["Page not found", "Delete “MacBook”?"]);

    await act(async () => {
      await i18n.changeLanguage("ja");
    });

    expect(result.current).toEqual([
      "ページが見つかりません",
      "「MacBook」を削除しますか?",
    ]);
  });

  test("訳に無いキーと、引数の誤りを型の誤りにする", () => {
    const { result } = renderHook(useTranslate, {
      wrapper: withI18n(createI18n("en")),
    });
    const t = result.current;
    // @ts-expect-error -- 訳に無いキー
    const unknownKey = t("notFound.missing");
    // @ts-expect-error -- name を渡していない
    const missingArgument = t("passkeys.deleteTitle");
    // @ts-expect-error -- 引数は name
    const wrongArgument = t("passkeys.deleteTitle", { path: "MacBook" });

    expect(unknownKey).toBe("notFound.missing");
    expect(missingArgument).toBe("Delete “{{name}}”?");
    expect(wrongArgument).toBe("Delete “{{name}}”?");
  });
});

describe("useLocale", () => {
  test("言語を切り替えたら、今の Locale を返す", async () => {
    const i18n = createI18n("en");
    const { result } = renderHook(useLocale, { wrapper: withI18n(i18n) });

    expect<Locale>(result.current).toBe("en");

    await act(async () => {
      await i18n.changeLanguage("zh-Hans");
    });

    expect<Locale>(result.current).toBe("zh-Hans");
  });
});
