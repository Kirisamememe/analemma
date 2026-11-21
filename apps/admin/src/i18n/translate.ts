import type { Locale } from "./locales";
import { en } from "./messages/en";
import { ja } from "./messages/ja";
import { zhHans } from "./messages/zh-hans";
import { pickMessage } from "./pick-message";
import type { MessageArgs, MessageKey, Translation } from "./translation";

/** 言語ごとの訳。 */
export const TRANSLATIONS: Readonly<Record<Locale, Translation>> = {
  en,
  ja,
  "zh-Hans": zhHans,
};

const PLACEHOLDER = /\{(?<name>[^\{\}]+)\}/gv;

/** キーから訳を引き、`{name}` に引数を入れる関数。 */
export type Translate = <Key extends MessageKey>(
  key: Key,
  ...args: MessageArgs<Key>
) => string;

/** 1つの言語の訳を引く関数を作る。 */
export const createTranslate =
  (locale: Locale): Translate =>
  (key, ...args) => {
    const message = pickMessage(TRANSLATIONS[locale], key);
    const [params] = args;

    if (params === undefined) {
      return message;
    }

    const values: Readonly<Record<string, string | number>> = params;

    return message.replaceAll(
      PLACEHOLDER,
      (placeholder, name: string) => `${values[name] ?? placeholder}`,
    );
  };
