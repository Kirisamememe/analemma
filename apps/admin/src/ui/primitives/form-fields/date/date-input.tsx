import type { ReactNode } from "react";

import { type DateInputProps, DateRoot } from "./date-root";
import { DateSegments } from "./date-segments";
import { useDateDraft } from "./hooks/use-date-draft";

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
