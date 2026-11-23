import { useSelector } from "@tanstack/react-form";
import type { ReactNode } from "react";

import {
  useFieldContext,
  useFieldError,
  useIsSubmitting,
} from "./hooks/use-field-context";

import { TextArea, type TextAreaProps } from "@/ui/primitives/form-fields";

type AppTextAreaProps = Pick<
  TextAreaProps,
  | "description"
  | "isDisabled"
  | "isReadOnly"
  | "isRequired"
  | "label"
  | "maxLength"
>;

/** TanStack Form につないだ長いテキストの入力欄。 */
export const AppTextArea = (props: AppTextAreaProps): ReactNode => {
  const field = useFieldContext<string | undefined>();
  const value = useSelector(field.store, (state) => state.value);
  const errorMessage = useFieldError();
  const isSubmitting = useIsSubmitting();

  return (
    <TextArea
      description={props.description}
      errorMessage={errorMessage}
      isDisabled={props.isDisabled}
      isReadOnly={isSubmitting || props.isReadOnly === true}
      isRequired={props.isRequired}
      label={props.label}
      maxLength={props.maxLength}
      name={field.name}
      onBlur={field.handleBlur}
      onChange={field.handleChange}
      validationBehavior="aria"
      value={value ?? ""}
    />
  );
};
