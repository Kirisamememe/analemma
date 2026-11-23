import { z } from "zod";

const SINGLE_LINE = /^\P{Cc}*$/v;
const MAX_FIELDS = 100;

const isWellFormed = (value: string): boolean => value.isWellFormed();

const isUnique = (values: readonly string[]): boolean =>
  new Set(values).size === values.length;

/** 管理画面に出す、種類・項目・選択肢のラベル。 */
export const displayLabel = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(SINGLE_LINE, { error: "改行と制御文字は使えない" })
  .refine(isWellFormed, { error: "対になっていないサロゲートは使えない" })
  .describe("管理画面に出すラベル。");

/** 項目のキーで、中身のオブジェクトのキーになるもの。 */
export const fieldKey = z
  .string()
  .max(64)
  .regex(/^[A-Za-z][A-Za-z0-9]*$/v, {
    error: "英字で始め、英字と数字だけで書く",
  })
  .refine((key) => !(key in Object.prototype), {
    error: "constructor など、オブジェクトが元から持つ名前は使えない",
  })
  .describe("中身のオブジェクトのキー。");

const selectOption = z.object({
  value: z
    .string()
    .min(1)
    .max(100)
    .regex(SINGLE_LINE, { error: "改行と制御文字は使えない" })
    .refine(isWellFormed, { error: "対になっていないサロゲートは使えない" })
    .describe("中身に入る値。"),
  label: displayLabel,
});

const common = {
  key: fieldKey,
  label: displayLabel,
  optional: z.boolean().default(false).describe("値を省けるか。"),
};

const textField = z.object({ ...common, type: z.literal("text") });
const longTextField = z.object({ ...common, type: z.literal("longText") });
const numberField = z.object({ ...common, type: z.literal("number") });
const booleanField = z.object({
  key: fieldKey,
  label: displayLabel,
  type: z.literal("boolean"),
  default: z
    .boolean()
    .default(false)
    .describe("新しいページと、値の無いページで使う値。"),
  optional: z
    .never({
      error:
        "真偽値の項目には optional を指定できない。3つ目の状態が要るなら select を使う",
    })
    .optional(),
});
const dateField = z.object({ ...common, type: z.literal("date") });
const urlField = z.object({ ...common, type: z.literal("url") });

const selectField = z.object({
  ...common,
  type: z.literal("select"),
  options: z
    .array(selectOption)
    .min(1)
    .max(MAX_FIELDS)
    .refine((options) => isUnique(options.map(({ value }) => value)), {
      error: "選択肢の値が重なっている",
    }),
});

const commonFields = z.object(common);

type ScalarField = z.output<
  | typeof textField
  | typeof longTextField
  | typeof numberField
  | typeof booleanField
  | typeof dateField
  | typeof urlField
  | typeof selectField
>;

type ScalarFieldInput = z.input<
  | typeof textField
  | typeof longTextField
  | typeof numberField
  | typeof booleanField
  | typeof dateField
  | typeof urlField
  | typeof selectField
>;

/** 検査した、項目の定義。 */
export type FieldDefinition =
  | ScalarField
  | (z.output<typeof commonFields> & {
      /** 項目の型。 */
      readonly type: "group" | "repeat";
      /** 中に並べる項目の定義。 */
      readonly fields: readonly FieldDefinition[];
    });

/** 送る前の、項目の定義。 */
export type FieldDefinitionInput =
  | ScalarFieldInput
  | (z.input<typeof commonFields> & {
      /** 項目の型。 */
      readonly type: "group" | "repeat";
      /** 中に並べる項目の定義。 */
      readonly fields: readonly FieldDefinitionInput[];
    });

const groupField = z.object({
  ...common,
  type: z.literal("group"),
  get fields() {
    return nestedFields;
  },
});

const repeatField = z.object({
  ...common,
  type: z.literal("repeat"),
  get fields() {
    return nestedFields;
  },
});

/** 種類の中の、1つの項目の定義。 */
export const fieldDefinition: z.ZodType<FieldDefinition, FieldDefinitionInput> =
  z.discriminatedUnion("type", [
    textField,
    longTextField,
    numberField,
    booleanField,
    dateField,
    urlField,
    selectField,
    groupField,
    repeatField,
  ]);

const nestedFields: z.ZodType<
  readonly FieldDefinition[],
  readonly FieldDefinitionInput[]
> = z
  .array(fieldDefinition)
  .min(1)
  .max(MAX_FIELDS)
  .refine((fields) => isUnique(fields.map(({ key }) => key)), {
    error: "項目のキーが重なっている",
  });

/** 種類の直下に並べる項目の定義。 */
export const fieldDefinitions = z
  .array(fieldDefinition)
  .max(MAX_FIELDS)
  .refine((fields) => isUnique(fields.map(({ key }) => key)), {
    error: "項目のキーが重なっている",
  })
  .describe("フォームに並べる順の、項目の定義。");
