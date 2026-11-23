import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { type DateInputProps, DateRoot, DateSegments } from "./date-input";
import { useDateDraft } from "./hooks/use-date-draft";

import {
  FieldDescription,
  FieldErrorMessage,
  FieldLabel,
} from "@/ui/primitives/form-fields/field-parts";

/** ラベル付きの日付の入力欄に渡す値。 */
export type DateFieldProps = Omit<
  DateInputProps,
  "aria-label" | "isInvalid" | "name"
> & {
  /** フォームのキー。 */
  name: string;
  /** ラベル。 */
  label: string;
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
  isRequired,
  isReadOnly,
  onBlur,
  onChange,
  validationBehavior,
  validate,
}: DateFieldProps): ReactNode => {
  const { t } = useTranslation();
  const draft = useDateDraft({ value, onBlur, onChange });

  const message = draft.incomplete
    ? t("ui.dateField.incomplete")
    : errorMessage;

  return (
    <DateRoot
      defaultValue={defaultValue}
      incomplete={draft.incomplete}
      isDisabled={isDisabled}
      isInvalid={message === undefined ? undefined : true}
      isReadOnly={isReadOnly}
      isRequired={isRequired}
      name={name}
      onChange={draft.onChange}
      validate={validate}
      validationBehavior={validationBehavior}
      value={value}
    >
      <FieldLabel isRequired={isRequired}>{label}</FieldLabel>
      <DateSegments onBlur={draft.onBlur} />
      {description !== undefined && (
        <FieldDescription>{description}</FieldDescription>
      )}
      <FieldErrorMessage>{message}</FieldErrorMessage>
    </DateRoot>
  );
};
