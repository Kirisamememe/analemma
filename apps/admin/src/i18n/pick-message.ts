import { en } from "./messages/en";
import type { MessageKey, Translation } from "./translation";

/** 訳からキーの文字列を引き、訳していないキーには英語を返す。 */
export const pickMessage = (
  translation: Translation,
  key: MessageKey,
): string => translation[key] ?? en[key];
