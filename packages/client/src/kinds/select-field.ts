import { z } from "zod";

import { registerField } from "./field-registry";

/** 選択肢の1つ。 */
export type SelectOption<Value extends string> = {
  /** 中身に入る値。 */
  readonly value: Value;
  /** 管理画面に出す名前。 */
  readonly label: string;
};

/** 選択肢から1つを選ぶ項目の、名前と選択肢。 */
export type SelectOptions<Value extends string> = {
  /** 管理画面のフォームに出す、項目の名前。 */
  readonly label: string;
  /** 選べる値と、その名前。 */
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
