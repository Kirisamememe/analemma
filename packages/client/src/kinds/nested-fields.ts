import { z } from "zod";

import { type FieldShape, registerField } from "./field-registry";
import { toFieldDefinitions } from "./to-field-definitions";

/** グループと繰り返しの項目の、名前と中の項目。 */
export type NestedOptions<Shape extends FieldShape> = {
  /** 管理画面のフォームに出す、項目の名前。 */
  readonly label: string;
  /** 中に並べる項目。 */
  readonly fields: Shape;
};

/** いくつかの項目をまとめた、グループの項目。 */
export const group = <const Shape extends FieldShape>({
  fields,
  label,
}: NestedOptions<Shape>) =>
  registerField(z.object(fields), {
    type: "group",
    label,
    optional: false,
    fields: toFieldDefinitions(fields),
  });

/** グループを並べた、繰り返しの項目。 */
export const repeat = <const Shape extends FieldShape>({
  fields,
  label,
}: NestedOptions<Shape>) =>
  registerField(z.array(z.object(fields)), {
    type: "repeat",
    label,
    optional: false,
    fields: toFieldDefinitions(fields),
  });
