import { useSelector } from "@tanstack/react-form";
import { type ReactNode, useRef } from "react";

import { useFormContext } from "./hooks/use-field-context";

import { Form } from "@/ui/primitives/form";
import { focusFirstInvalidField } from "@/ui/primitives/form-fields";

/** TanStack Form につないだフォームに渡す値。 */
type BoundFormProps = {
  /** このフォームを送るボタンから参照する ID。 */
  id?: string | undefined;
  /** `onSubmit` の後も続く、送っている操作があるか。 */
  isPending?: boolean | undefined;
  /** server が断った入力ごとの、誤りの知らせ。 */
  validationErrors?: Readonly<Record<string, string>> | undefined;
  /** 入力欄とボタン。 */
  children: ReactNode;
};

/** TanStack Form で入力を確かめて送るフォーム。 */
export const BoundForm = ({
  id,
  isPending = false,
  validationErrors,
  children,
}: BoundFormProps): ReactNode => {
  const form = useFormContext();
  const element = useRef<HTMLFormElement>(null);
  const isSubmitting = useSelector(form.store, (state) => state.isSubmitting);

  const submit = async (): Promise<void> => {
    await form.handleSubmit();

    if (!form.state.isValid) {
      focusFirstInvalidField(element.current);
    }
  };

  return (
    <Form
      id={id}
      isPending={isPending || isSubmitting}
      onSubmit={() => {
        void submit();
      }}
      ref={element}
      validationErrors={validationErrors}
    >
      {children}
    </Form>
  );
};
