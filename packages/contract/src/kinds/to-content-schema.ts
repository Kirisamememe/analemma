import { z } from "zod";

import {
  booleanValue,
  dateValue,
  longTextValue,
  numberValue,
  textValue,
  urlValue,
} from "./content-values";
import type { FieldDefinition } from "./field-definition";

/** 定義に無いキーを、残すか取り除くか。 */
export type UnknownKeys = "keep" | "strip";

/** 中身のスキーマを作るための、項目の定義と定義に無いキーの扱い。 */
export type ContentSchemaOptions = {
  /** 種類の直下の項目の定義。 */
  readonly fields: readonly FieldDefinition[];
  /** 定義に無いキーの扱い。 */
  readonly unknownKeys: UnknownKeys;
};

const toValueSchema = (
  field: FieldDefinition,
  unknownKeys: UnknownKeys,
): z.ZodType => {
  switch (field.type) {
    case "text":
      return textValue;
    case "longText":
      return longTextValue;
    case "number":
      return numberValue;
    case "boolean":
      return booleanValue.default(field.default);
    case "date":
      return dateValue;
    case "url":
      return urlValue;
    case "select":
      return z.enum(field.options.map(({ value }) => value));
    case "group":
      return toContentSchema({ fields: field.fields, unknownKeys });
    case "repeat":
      return z.array(toContentSchema({ fields: field.fields, unknownKeys }));
  }
};

/** 項目の定義から、ページの中身を検査するスキーマを作る。 */
export const toContentSchema = ({
  fields,
  unknownKeys,
}: ContentSchemaOptions): z.ZodType<Record<string, unknown>> => {
  const shape = Object.fromEntries(
    fields.map((field) => {
      const value = toValueSchema(field, unknownKeys);

      return [field.key, field.optional === true ? value.optional() : value];
    }),
  );

  return unknownKeys === "keep" ? z.looseObject(shape) : z.object(shape);
};
