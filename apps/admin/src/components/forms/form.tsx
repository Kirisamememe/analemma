import { useSelector } from "@tanstack/react-form";
import { type ReactNode, useRef } from "react";

import { useFormContext } from "./hooks/use-field-context";

import { Form } from "@/ui/primitives/form";
import { focusFirstInvalidField } from "@/ui/primitives/form-fields";

/** TanStack Form につないだフォームに渡す値。 */
type BoundFormProps = {
  /** `onSubmit` の後も続く、送っている操作があるか。 */
  isPending?: boolean | undefined;
  /** 入力欄とボタン。 */
  children: ReactNode;
};

/** TanStack Form で入力を確かめて送るフォーム。 */
export const BoundForm = ({
  isPending = false,
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
      isPending={isPending || isSubmitting}
      onSubmit={() => {
        void submit();
      }}
      ref={element}
    >
      {children}
    </Form>
  );
};
