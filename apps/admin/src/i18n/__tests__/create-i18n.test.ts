import { describe, expect, test } from "bun:test";

import { createI18n } from "../create-i18n";

const TITLE = {
  en: "Page not found",
  ja: "ページが見つかりません",
  "zh-Hans": "找不到页面",
};

describe("createI18n", () => {
  test.each(["en", "ja", "zh-Hans"] as const)(
    "作ったその場で、%s の訳を引ける",
    (locale) => {
      expect<string>(createI18n(locale).t("notFound.title")).toBe(
        TITLE[locale],
      );
    },
  );

  test("{{name}} に引数を入れ、HTML の escape はしない(React が escape する)", () => {
    expect<string>(
      createI18n("ja").t("notFound.description", { path: "/a?b=1&c=<d>" }),
    ).toBe("/a?b=1&c=<d> にページはありません。");
  });

  test("訳が空のキーは、英語にする", () => {
    const i18n = createI18n("ja");

    i18n.addResource("ja", "translation", "notFound.title", "");

    expect<string>(i18n.t("notFound.title")).toBe(TITLE.en);
  });

  test("切り替えた言語の訳を、読み込みを待たずに引ける", () => {
    const i18n = createI18n("en");

    void i18n.changeLanguage("ja");

    expect(i18n.language).toBe("ja");
    expect<string>(i18n.t("notFound.title")).toBe(TITLE.ja);
  });

  test("対応していない言語に切り替えると、英語にする", async () => {
    const i18n = createI18n("ja");

    await i18n.changeLanguage("fr");

    expect(i18n.language).toBe("en");
    expect<string>(i18n.t("notFound.title")).toBe(TITLE.en);
  });

  test("instance ごとに言語を持ち、ほかの instance の切り替えに左右されない", async () => {
    const ja = createI18n("ja");

    await createI18n("en").changeLanguage("zh-Hans");

    expect<string>(ja.t("notFound.title")).toBe(TITLE.ja);
  });

  test("instance ごとに訳を持ち、ほかの instance で書き換えた訳に左右されない", () => {
    createI18n("ja").addResource(
      "ja",
      "translation",
      "notFound.title",
      "書き換えた訳",
    );

    expect<string>(createI18n("ja").t("notFound.title")).toBe(TITLE.ja);
  });

  test("訳に無いキーと、引数の渡し忘れを、型の誤りにする", () => {
    const i18n = createI18n("en");
    // @ts-expect-error -- 訳に無いキー
    const missingKey: string = i18n.t("notFound.missing");
    // @ts-expect-error -- 引数の path を渡していない
    const missingArgument: string = i18n.t("notFound.description");

    expect(missingKey).toBe("notFound.missing");
    expect(missingArgument).toBe("There is no page at {{path}}.");
  });
});
