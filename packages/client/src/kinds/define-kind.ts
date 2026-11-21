import { z } from "zod";

import { type KindDefinition, kindDefinition } from "@analemma/contract";

import type { FieldShape } from "./field-registry";
import { toFieldDefinitions } from "./to-field-definitions";

/** 種類の名前・管理画面に出す名前・項目。 */
export type KindOptions<Name extends string, Shape extends FieldShape> = {
  /** 種類の名前(kebab-case)。 */
  readonly name: Name;
  /** 管理画面に出す、種類の名前。 */
  readonly label: string;
  /** フォームに並べる順の項目。 */
  readonly fields: Shape;
};

/** 公開サイトで定義した、固定ページの種類。 */
export type Kind<Name extends string, Shape extends FieldShape> = {
  /** 種類の名前。 */
  readonly name: Name;
  /** CMS に送る、種類の定義。 */
  readonly definition: KindDefinition;
  /** 固定ページの中身を検査し、型を付けるスキーマ。 */
  readonly content: z.ZodObject<{ -readonly [Key in keyof Shape]: Shape[Key] }>;
};

/** どの種類でも受け取る関数のための、種類の型。 */
export type AnyKind = {
  /** 種類の名前。 */
  readonly name: string;
  /** CMS に送る、種類の定義。 */
  readonly definition: KindDefinition;
  /** 固定ページの中身を検査し、型を付けるスキーマ。 */
  readonly content: z.ZodType<Record<string, unknown>>;
};

/** 種類の定義から推論した、固定ページの中身の型。 */
export type KindContent<K extends AnyKind> = z.output<K["content"]>;

/** 固定ページの種類を定義する。 */
export const defineKind = <
  const Name extends string,
  const Shape extends FieldShape,
>({
  fields,
  label,
  name,
}: KindOptions<Name, Shape>): Kind<Name, Shape> => ({
  name,
  definition: kindDefinition.parse({
    name,
    label,
    fields: toFieldDefinitions(fields),
  }),
  content: z.object({ ...fields }),
});
