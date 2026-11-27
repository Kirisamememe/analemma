import { z } from "zod";

const SINGLE_LINE = /^\P{Cc}*$/v;
const MULTI_LINE = /^[\P{Cc}\t\n\r]*$/v;

const isWellFormed = (value: string): boolean => value.isWellFormed();

/** repeat の項目に並べられる要素の数の上限。 */
export const REPEAT_MAX_ITEMS = 100;

/** テキストの項目の値。 */
export const textValue = z
  .string()
  .min(1)
  .max(1000)
  .regex(SINGLE_LINE, { error: "改行と制御文字は使えない" })
  .refine(isWellFormed, { error: "対になっていないサロゲートは使えない" });

/** 長いテキストの項目の値。 */
export const longTextValue = z
  .string()
  .min(1)
  .max(100_000)
  .regex(MULTI_LINE, { error: "改行とタブを除く制御文字は使えない" })
  .refine(isWellFormed, { error: "対になっていないサロゲートは使えない" });

/** 数値の項目の値。 */
export const numberValue = z.number();

/** 真偽値の項目の値。 */
export const booleanValue = z.boolean();

/** 日付の項目の値(`YYYY-MM-DD`)。 */
export const dateValue = z.iso.date();

/** URL の項目の値(http か https)。 */
export const urlValue = z
  .string()
  .max(2000)
  .regex(SINGLE_LINE, { error: "改行と制御文字は使えない" })
  .refine(isWellFormed, { error: "対になっていないサロゲートは使えない" })
  .pipe(z.url({ protocol: /^https?$/v }));
