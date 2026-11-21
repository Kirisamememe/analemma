import { describe, expect, test } from "bun:test";

import { LOCALES } from "../locales";
import { en } from "../messages/en";
import { TRANSLATIONS } from "../translate";

const PLACEHOLDER = /\{(?<name>[^\{\}]+)\}/gv;

const placeholdersOf = (message: string): string[] =>
  [...message.matchAll(PLACEHOLDER)]
    .map(({ groups }) => groups?.["name"] ?? "")
    .toSorted();

const english = Object.entries(en);

describe.each(LOCALES)("%s の訳", (locale) => {
  const translation = new Map(Object.entries(TRANSLATIONS[locale]));

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

  test("空の訳を持たない", () => {
    expect([...translation].filter(([, message]) => message === "")).toEqual(
      [],
    );
  });
});
