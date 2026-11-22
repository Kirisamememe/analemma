import { type FieldDefinition, fieldDefinitions } from "@analemma/contract";

/** DB の JSONB から読んだ項目の定義を、検査して型を付ける。 */
export const readKindFields = (value: unknown): FieldDefinition[] =>
  fieldDefinitions.parse(value);
