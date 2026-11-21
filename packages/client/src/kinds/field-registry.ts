import type { z } from "zod";

import type { FieldDefinition } from "@analemma/contract";

type WithoutKey<T> = T extends unknown ? Omit<T, "key"> : never;

/** キーを除いた、項目の定義。 */
export type FieldMeta = WithoutKey<FieldDefinition>;

/** 項目の名前をキーにした、項目の値のスキーマの並び。 */
export type FieldShape = Readonly<Record<string, z.ZodType>>;

const metas = new WeakMap<z.ZodType, FieldMeta>();

/** 項目の関数で作った値のスキーマに、項目の定義を結びつける。 */
export const registerField = <Schema extends z.ZodType>(
  schema: Schema,
  meta: FieldMeta,
): Schema => {
  metas.set(schema, meta);

  return schema;
};

/** 項目の関数で作った値のスキーマから、結びつけた項目の定義を読む。 */
export const readFieldMeta = (schema: z.ZodType): FieldMeta => {
  const meta = metas.get(schema);

  if (meta === undefined) {
    throw new Error(
      "項目には、@analemma/client の項目の関数で作ったスキーマだけを使える",
    );
  }

  return meta;
};
