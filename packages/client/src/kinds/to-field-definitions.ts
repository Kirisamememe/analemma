import type { FieldDefinition } from "@analemma/contract";

import { type FieldShape, readFieldMeta } from "./field-registry";

/** 項目の値のスキーマの並びを、送るための項目の定義の並びにする。 */
export const toFieldDefinitions = (shape: FieldShape): FieldDefinition[] =>
  Object.entries(shape).map(([key, schema]) =>
    Object.assign({ key }, readFieldMeta(schema)),
  );
