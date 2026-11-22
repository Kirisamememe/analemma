import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { type DateInputProps, DateRoot, DateSegments } from "./date-input";

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
  readonly name: string;
  /** ラベル。 */
  readonly label: string;
  /** 補足。 */
  readonly description?: string | undefined;
  /** 呼び出し元から渡す誤りの知らせ。 */
  readonly errorMessage?: string | undefined;
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
  const [incomplete, setIncomplete] = useState(false);
  const message = incomplete ? t("ui.dateField.incomplete") : errorMessage;

  return (
    <DateRoot
      defaultValue={defaultValue}
      isDisabled={isDisabled}
      isInvalid={message === undefined ? undefined : true}
      isReadOnly={isReadOnly}
      isRequired={isRequired}
      name={name}
      onChange={(next) => {
        setIncomplete(false);
        onChange?.(next);
      }}
      validate={validate}
      validationBehavior={incomplete ? "native" : validationBehavior}
      value={value}
    >
      <FieldLabel>{label}</FieldLabel>
      <DateSegments
        onBlur={(isIncomplete) => {
          setIncomplete(isIncomplete);
          onBlur?.();
        }}
      />
      {description !== undefined && (
        <FieldDescription>{description}</FieldDescription>
      )}
      <FieldErrorMessage>{message}</FieldErrorMessage>
    </DateRoot>
  );
};
