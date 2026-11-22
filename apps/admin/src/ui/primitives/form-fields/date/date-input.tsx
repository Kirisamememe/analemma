import { parseDate, type CalendarDate } from "@internationalized/date";
import { useContext, useMemo, type ReactNode } from "react";
import { useFocusWithin } from "react-aria";
import {
  DateField as AriaDateField,
  DateFieldStateContext,
  DateInput as AriaDateInput,
  DateSegment,
} from "react-aria-components";

import { useDateDraft } from "./use-date-draft";

import {
  fieldControl,
  fieldRoot,
} from "@/ui/primitives/form-fields/field-control";
import { typography } from "@/ui/typography";

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

type DateSegmentsProps = {
  /** focus が外れたときに呼ぶ関数。 */
  onBlur?: (incomplete: boolean) => void;
};

/** キーボードで日付の segment を編集する入力。 */
export const DateSegments = ({ onBlur }: DateSegmentsProps): ReactNode => {
  const state = useContext(DateFieldStateContext);
  const {
    focusWithinProps: { onBlur: blurWithin, onFocus: focusWithin },
  } = useFocusWithin({
    onBlurWithin: () => {
      const segments =
        state?.segments.filter((segment) => segment.isEditable) ?? [];
      onBlur?.(
        segments.some((segment) => segment.isPlaceholder) &&
          segments.some((segment) => !segment.isPlaceholder),
      );
    },
  });

  return (
    <div onBlur={blurWithin} onFocus={focusWithin}>
      <AriaDateInput
        className={fieldControl({
          className: [
            "flex h-control items-center px-2 tabular-nums focus-within:focus-ring",
            typography({ role: "body" }),
          ],
        })}
      >
        {(segment) => (
          <DateSegment
            className="rounded-xs px-1 outline-hidden is-focused:focus-ring-inset is-placeholder:text-fg-muted"
            segment={segment}
          />
        )}
      </AriaDateInput>
    </div>
  );
};

/** 日付を編集する入力。 */
export const DateInput = ({
  "aria-label": ariaLabel,
  name,
  defaultValue,
  value,
  isDisabled,
  isInvalid,
  isRequired,
  onBlur,
  onChange,
  validationBehavior,
  isReadOnly,
  validate,
}: DateInputProps): ReactNode => {
  const draft = useDateDraft({ value, onBlur, onChange });

  return (
    <DateRoot
      aria-label={ariaLabel}
      defaultValue={defaultValue}
      incomplete={draft.incomplete}
      isDisabled={isDisabled}
      isInvalid={isInvalid}
      isReadOnly={isReadOnly}
      isRequired={isRequired}
      name={name}
      onChange={draft.onChange}
      validate={validate}
      validationBehavior={validationBehavior}
      value={value}
    >
      <DateSegments onBlur={draft.onBlur} />
    </DateRoot>
  );
};
