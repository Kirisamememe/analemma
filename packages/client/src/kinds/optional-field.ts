import type { z } from "zod";

import { readFieldMeta, registerField } from "./field-registry";

/** 項目を、値を省ける項目にする。 */
export const optional = <Schema extends z.ZodType>(
  schema: Schema,
): z.ZodOptional<Schema> =>
  registerField(schema.optional(), {
    ...readFieldMeta(schema),
    optional: true,
  });
