import { z } from "zod";

import {
  type FieldDefinition,
  booleanValue,
  dateValue,
  longTextValue,
  numberValue,
  textValue,
  urlValue,
} from "@analemma/contract";

import {
  registerField,
  type FieldShape,
  readFieldMeta,
} from "./field-registry";
import { toFieldDefinitions } from "./to-field-definitions";

/** 項目の関数に渡す、管理画面に出すラベル。 */
export type FieldOptions = {
  /** 管理画面のフォームに出す、項目のラベル。 */
  readonly label: string;
};

type ScalarType = Exclude<
  FieldDefinition["type"],
  "boolean" | "group" | "repeat" | "select"
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

/** 真偽値の項目の、ラベルと既定値。 */
export type BooleanOptions = FieldOptions & {
  /** 新しいページと、値の無いページで使う値(省くと false)。 */
  readonly default?: boolean;
};

/** 真偽値の項目。 */
export const boolean = ({ label, default: initial = false }: BooleanOptions) =>
  registerField(booleanValue.default(initial), {
    type: "boolean",
    label,
    default: initial,
  });

/** 日付(`YYYY-MM-DD`)の項目。 */
export const date = defineScalar("date", dateValue);

/** http か https の URL の項目。 */
export const url = defineScalar("url", urlValue);

/** 選択肢の1つ。 */
export type SelectOption<Value extends string> = {
  /** 中身に入る値。 */
  readonly value: Value;
  /** 管理画面に出すラベル。 */
  readonly label: string;
};

/** 選択肢から1つを選ぶ項目の、ラベルと選択肢。 */
export type SelectOptions<Value extends string> = {
  /** 管理画面のフォームに出す、項目のラベル。 */
  readonly label: string;
  /** 選べる値と、そのラベル。 */
  readonly options: readonly SelectOption<Value>[];
};

/** 選択肢から1つを選ぶ項目。 */
export const select = <const Value extends string>({
  label,
  options,
}: SelectOptions<Value>) =>
  registerField(z.enum(options.map(({ value }) => value)), {
    type: "select",
    label,
    optional: false,
    options: options.map((option) => ({
      value: option.value,
      label: option.label,
    })),
  });

/** グループと繰り返しの項目の、ラベルと中の項目。 */
export type NestedOptions<Shape extends FieldShape> = {
  /** 管理画面のフォームに出す、項目のラベル。 */
  readonly label: string;
  /** 中に並べる項目。 */
  readonly fields: Shape;
};

/** いくつかの項目をまとめた、グループの項目。 */
export const group = <const Shape extends FieldShape>({
  fields,
  label,
}: NestedOptions<Shape>) => {
  const shape = { ...fields };

  return registerField(z.object(shape), {
    type: "group",
    label,
    optional: false,
    fields: toFieldDefinitions(shape),
  });
};

/** グループを並べた、繰り返しの項目。 */
export const repeat = <const Shape extends FieldShape>({
  fields,
  label,
}: NestedOptions<Shape>) => {
  const shape = { ...fields };

  return registerField(z.array(z.object(shape)), {
    type: "repeat",
    label,
    optional: false,
    fields: toFieldDefinitions(shape),
  });
};

/** 項目を、値を省ける項目にする。 */
export const optional = <Schema extends z.ZodType>(
  schema: z.output<Schema> extends boolean ? never : Schema,
): z.ZodOptional<Schema> => {
  const meta = readFieldMeta(schema);

  if (meta.type === "boolean") {
    throw new Error(
      "真偽値の項目は省けない。3つ目の状態が要るなら select を使う",
    );
  }

  return registerField(schema.optional(), { ...meta, optional: true });
};
