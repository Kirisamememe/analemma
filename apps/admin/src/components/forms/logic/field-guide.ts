import type { Locale } from "@/i18n/locales";
import type { useTranslate } from "@/i18n/use-translate";

type TextLimits = {
  /** 保存できる最小の文字数。 */
  minLength: number | null;
  /** 保存できる最大の文字数。 */
  maxLength: number | null;
};

type GuideOptions = {
  /** 空欄にできない項目か。 */
  required?: boolean;
  /** 書式など、文字数と一緒に伝える案内。 */
  hint?: string;
};

/** 入力できる文字数と書式を欄の補足にまとめる。 */
export const createFieldGuide =
  (t: ReturnType<typeof useTranslate>, locale: Locale) =>
  (
    limits: TextLimits,
    { required = false, hint }: GuideOptions = {},
  ): string | undefined => {
    const min = required ? limits.minLength : null;
    const max = limits.maxLength;

    let length: string;

    if (max !== null) {
      length =
        min === null
          ? t("ui.guide.characterLimit", { max: max.toLocaleString(locale) })
          : t("ui.guide.characterRange", {
              min: min.toLocaleString(locale),
              max: max.toLocaleString(locale),
            });
    } else if (min === null) {
      return hint;
    } else {
      length = t("ui.guide.characterMinimum", {
        min: min.toLocaleString(locale),
      });
    }

    return hint === undefined
      ? length
      : t("ui.guide.withHint", { hint, length });
  };
