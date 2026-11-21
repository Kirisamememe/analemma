import type { FieldDefinition } from "@analemma/contract";

import { type FieldShape, readFieldMeta } from "./field-registry";

/** 項目の値のスキーマの並びを、送るための項目の定義の並びにする。 */
export const toFieldDefinitions = (shape: FieldShape): FieldDefinition[] => {
  if (Object.getOwnPropertySymbols(shape).length > 0) {
    throw new Error("項目のキーには、symbol でなく文字列を使う");
  }

  return Object.entries(shape).map(([key, schema]) =>
    Object.assign({ key }, readFieldMeta(schema)),
  );
};
