import type { Locale } from "@/i18n/locales";
import { en } from "@/i18n/messages/en";
import { ja } from "@/i18n/messages/ja";
import { zhHans } from "@/i18n/messages/zh-hans";
import type { Translation } from "@/i18n/translation";

/** i18next に渡す、言語ごとの訳(namespace は既定の1つだけ)。 */
export const RESOURCES = {
  en: { translation: en },
  ja: { translation: ja },
  "zh-Hans": { translation: zhHans },
} as const satisfies Readonly<
  Record<Locale, Readonly<Record<"translation", Translation>>>
>;

declare module "i18next" {
  // oxlint-disable-next-line typescript/consistent-type-definitions -- i18next の型の設定は、interface の宣言のマージでしか書けない
  interface CustomTypeOptions {
    /** キーと引数の型の出どころ(英語の訳)。 */
    resources: (typeof RESOURCES)["en"];
    /** キーの `.` を、入れ子の区切りとして読まない。 */
    keySeparator: false;
    /** キーの `:` を、namespace の区切りとして読まない。 */
    nsSeparator: false;
    /** `defaultValue` を渡しても、キーと引数を確かめる。 */
    strictKeyChecks: true;
  }
}
