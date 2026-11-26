import { describe, expect, test } from "bun:test";

import { endsWithGuidePeriod } from "../../../test-setup/field-guide";

import { LOCALES } from "@/i18n/locales";
import { en } from "@/i18n/messages/en";
import { RESOURCES } from "@/i18n/resources";

const PLACEHOLDER = /\{\{(?<name>[A-Za-z][A-Za-z0-9]*)\}\}/gv;
const BRACE = /[\{\}]/v;

const placeholdersOf = (message: string): string[] =>
  [...message.matchAll(PLACEHOLDER)]
    .map(({ groups }) => groups?.["name"] ?? "")
    .toSorted();

const english = Object.entries(en);

describe.each(LOCALES)("%s の訳", (locale) => {
  const translation = new Map(Object.entries(RESOURCES[locale].translation));

  test("英語と同じキーをすべて持ち、英語に無いキーを持たない", () => {
    expect([...translation.keys()].toSorted()).toEqual(
      english.map(([key]) => key).toSorted(),
    );
  });

  test.each(english)("%s の訳が、英語と同じ引数を持つ", (key, message) => {
    expect(placeholdersOf(translation.get(key) ?? "")).toEqual(
      placeholdersOf(message),
    );
  });

  test("{ と } を、英字で始まる名前の引数 {{name}} にだけ使う", () => {
    expect(
      [...translation].filter(([, message]) =>
        BRACE.test(message.replaceAll(PLACEHOLDER, "")),
      ),
    ).toEqual([]);
  });

  test("CJK の入力ガイドの末尾に句点を付けない", () => {
    expect(
      [...translation].filter(
        ([key, message]) =>
          key.includes(".guide.") && endsWithGuidePeriod(locale, message),
      ),
    ).toEqual([]);
  });

  test("空の訳を持たない", () => {
    expect([...translation].filter(([, message]) => message === "")).toEqual(
      [],
    );
  });
});
