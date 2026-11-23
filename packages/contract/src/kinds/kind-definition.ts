import { z } from "zod";

import {
  type FieldDefinition,
  displayLabel,
  fieldDefinitions,
} from "./field-definition";

const MAX_DEPTH = 3;
const MAX_KINDS = 100;

const measureDepth = (fields: readonly FieldDefinition[]): number =>
  Math.max(
    1,
    ...fields.map((field) =>
      field.type === "group" || field.type === "repeat"
        ? 1 + measureDepth(field.fields)
        : 1,
    ),
  );

/** 種類の名前で、ページから種類を指すもの。 */
export const kindName = z
  .string()
  .max(64)
  .regex(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/v, {
    error: "英小文字で始め、英小文字・数字・ハイフンで書く",
  })
  .describe("種類の名前(kebab-case)。");

/** 固定ページの種類の定義。 */
export const kindDefinition = z.object({
  name: kindName,
  label: displayLabel,
  fields: fieldDefinitions.refine(
    (fields) => measureDepth(fields) <= MAX_DEPTH,
    {
      error: `項目の入れ子は、種類の直下の項目を含めて ${String(MAX_DEPTH)} 段まで`,
    },
  ),
});

/** 一度に送る、種類の定義の並び。 */
export const kindDefinitionList = z
  .array(kindDefinition)
  .max(MAX_KINDS)
  .refine(
    (kinds) => new Set(kinds.map(({ name }) => name)).size === kinds.length,
    { error: "種類の名前が重なっている" },
  );

/** 検査した、種類の定義。 */
export type KindDefinition = z.output<typeof kindDefinition>;

/** 送る前の、種類の定義。 */
export type KindDefinitionInput = z.input<typeof kindDefinition>;
