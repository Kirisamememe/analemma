import type { InterpolationMap, ParseKeysWithoutVariables } from "i18next";
import { useTranslation } from "react-i18next";

import { type Locale, toLocale } from "@/i18n/locales";
import type { en } from "@/i18n/messages/en";

/** 引数を取らない訳のキー。 */
export type MessageKey = ParseKeysWithoutVariables;

type Messages = typeof en;
type Translate = {
  (key: MessageKey): string;
  <Key extends Exclude<keyof Messages, MessageKey>>(
    key: Key,
    values: InterpolationMap<Messages[NoInfer<Key>]>,
  ): string;
};

/** 今の言語で訳を引く関数を返す。 */
export const useTranslate = (): Translate => useTranslation().t;

/** 今の言語を返す。 */
export const useLocale = (): Locale => toLocale(useTranslation().i18n.language);
