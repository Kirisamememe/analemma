import type { z } from "zod";

import {
  type FieldDefinition,
  booleanValue,
  dateValue,
  longTextValue,
  numberValue,
  textValue,
  urlValue,
} from "@analemma/contract";

import { registerField } from "./field-registry";

/** 項目の関数に渡す、管理画面に出すラベル。 */
export type FieldOptions = {
  /** 管理画面のフォームに出す、項目のラベル。 */
  readonly label: string;
};

type ScalarType = Exclude<
  FieldDefinition["type"],
  "group" | "repeat" | "select"
>;

const defineScalar =
  <Schema extends z.ZodType>(type: ScalarType, value: Schema) =>
  ({ label }: FieldOptions): Schema =>
    registerField(value.clone(), { type, label, optional: false });

/** 1行のテキストの項目。 */
export const text = defineScalar("text", textValue);

/** 改行を含められる、長いテキストの項目。 */
export const longText = defineScalar("longText", longTextValue);

/** 数値の項目。 */
export const number = defineScalar("number", numberValue);

/** 真偽値の項目。 */
export const boolean = defineScalar("boolean", booleanValue);

/** 日付(`YYYY-MM-DD`)の項目。 */
export const date = defineScalar("date", dateValue);

/** http か https の URL の項目。 */
export const url = defineScalar("url", urlValue);
