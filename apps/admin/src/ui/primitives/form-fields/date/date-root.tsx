import { parseDate, type CalendarDate } from "@internationalized/date";
import { useMemo, type ReactNode } from "react";
import { DateField as AriaDateField } from "react-aria-components";

import { fieldRoot } from "@/ui/primitives/form-fields/field-control";

/** 日付の入力に渡す値。 */
export type DateInputProps = {
  /** フォームのキー。 */
  name?: string | undefined;
  /** アクセシブルな名前。 */
  "aria-label"?: string | undefined;
  /** 最初に入れておく日付(`YYYY-MM-DD`)。 */
  defaultValue?: string | undefined;
  /** 呼び出し元で管理する日付。 */
  value?: string | null | undefined;
  /** 入力が要るか。 */
  isRequired?: boolean | undefined;
  /** 無効か。 */
  isDisabled?: boolean | undefined;
  /** 読み取り専用か。 */
  isReadOnly?: boolean | undefined;
  /** 誤りがあるか。 */
  isInvalid?: boolean | undefined;
  /** 日付が変わったときに呼ぶ関数。 */
  onChange?: ((value: string | null) => void) | undefined;
  /** focus が外れたときに呼ぶ関数。 */
  onBlur?: (() => void) | undefined;
  /** 入力の検証に使う React Aria Components の指定。 */
  validationBehavior?: "aria" | "native" | undefined;
  /** 送る前に日付を確かめる関数。 */
  validate?: ((value: string) => string | undefined) | undefined;
};

type DateRootProps = Omit<DateInputProps, "onBlur"> & {
  /** 日付が未完か。 */
  incomplete: boolean;
  /** 日付の入力を構成する部品。 */
  children: ReactNode;
};

/** 日付の状態と関連付けを子の部品に渡す。 */
export const DateRoot = ({
  "aria-label": ariaLabel,
  name,
  defaultValue,
  value,
  isRequired = false,
  isDisabled = false,
  isReadOnly = false,
  isInvalid,
  incomplete,
  onChange,
  validationBehavior,
  validate,
  children,
}: DateRootProps): ReactNode => {
  const date = useMemo(
    () => (value === undefined || value === null ? value : parseDate(value)),
    [value],
  );

  const defaultDate = useMemo(
    () => (defaultValue === undefined ? null : parseDate(defaultValue)),
    [defaultValue],
  );

  const invalid = incomplete ? true : isInvalid;
  const behavior = incomplete ? "native" : validationBehavior;

  const state = {
    ...(ariaLabel === undefined ? {} : { "aria-label": ariaLabel }),
    ...(name === undefined ? {} : { name }),
    ...(date === undefined ? {} : { value: date }),
    ...(invalid === undefined ? {} : { isInvalid: invalid }),
    ...(behavior === undefined ? {} : { validationBehavior: behavior }),
  };

  return (
    <AriaDateField<CalendarDate>
      className={fieldRoot()}
      defaultValue={defaultDate}
      granularity="day"
      hourCycle={24} // 言語を替えても、入力途中の値を作り直させない
      isDisabled={isDisabled}
      isReadOnly={isReadOnly}
      isRequired={isRequired}
      onChange={(next) => {
        onChange?.(next?.toString() ?? null);
      }}
      validate={(next) => validate?.(next.toString())}
      // oxlint-disable-next-line project/styling-boundary -- React Aria の未指定の props を省く。見た目の props は含まない。
      {...state}
    >
      {children}
    </AriaDateField>
  );
};
