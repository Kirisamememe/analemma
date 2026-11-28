import type { ReactNode } from "react";

import { type DateInputProps, DateRoot } from "./date-root";
import { DateSegments } from "./date-segments";
import { useDateDraft } from "./hooks/use-date-draft";

import { FieldDescription } from "@/ui/primitives/form-fields/parts/field-description";
import { FieldErrorMessage } from "@/ui/primitives/form-fields/parts/field-error-message";
import { FieldLabel } from "@/ui/primitives/form-fields/parts/field-label";

/** ラベル付きの日付の入力欄に渡す値。 */
export type DateFieldProps = Omit<
  DateInputProps,
  "aria-label" | "isInvalid" | "isRequired" | "name"
> & {
  /** フォームのキー。 */
  name: string;
  /** ラベル。 */
  label: string;
  /** 入力が要ることを示す文言。 */
  requiredLabel?: string | undefined;
  /** 年・月・日が埋まっていないときに出す、誤りの知らせ。 */
  incompleteMessage: string;
  /** 補足。 */
  description?: string | undefined;
  /** 呼び出し元から渡す誤りの知らせ。 */
  errorMessage?: string | undefined;
};

/** ラベルと補足と誤りの知らせを持つ、日付の入力欄。 */
export const DateField = ({
  name,
  label,
  description,
  errorMessage,
  defaultValue,
  value,
  isDisabled,
  requiredLabel,
  incompleteMessage,
  isReadOnly,
  onBlur,
  onChange,
  validationBehavior,
  validate,
}: DateFieldProps): ReactNode => {
  const draft = useDateDraft({ value, onBlur, onChange });

  const message = draft.incomplete ? incompleteMessage : errorMessage;

  return (
    <DateRoot
      defaultValue={defaultValue}
      incomplete={draft.incomplete}
      isDisabled={isDisabled}
      isInvalid={message === undefined ? undefined : true}
      isReadOnly={isReadOnly}
      isRequired={requiredLabel !== undefined}
      name={name}
      onChange={draft.onChange}
      validate={validate}
      validationBehavior={validationBehavior}
      value={value}
    >
      <FieldLabel requiredLabel={requiredLabel}>{label}</FieldLabel>
      <DateSegments onBlur={draft.onBlur} />
      {description !== undefined && (
        <FieldDescription>{description}</FieldDescription>
      )}
      <FieldErrorMessage>{message}</FieldErrorMessage>
    </DateRoot>
  );
};
