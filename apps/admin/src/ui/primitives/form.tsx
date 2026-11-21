import type { ReactNode } from "react";
import {
  Form as AriaForm,
  type FormProps as AriaFormProps,
} from "react-aria-components";

const NO_ERRORS: Readonly<Record<string, string>> = {};

/** フォームに渡す値。 */
type FormProps = {
  /** 送ったときに、入力をまとめて受け取る関数。 */
  readonly onSubmit: (data: FormData) => void;
  /** server が断った入力ごとの、誤りの知らせ。 */
  readonly validationErrors?: Readonly<Record<string, string>>;
  /** 入力欄とボタン。 */
  readonly children: ReactNode;
};

/** 入力欄をまとめて送るフォーム。 */
export const Form = ({
  onSubmit,
  validationErrors = NO_ERRORS,
  children,
}: FormProps): ReactNode => {
  const submit: NonNullable<AriaFormProps["onSubmit"]> = (event) => {
    event.preventDefault();
    onSubmit(new FormData(event.currentTarget));
  };

  return (
    <AriaForm
      className="flex flex-col gap-4"
      onSubmit={submit}
      validationErrors={validationErrors}
    >
      {children}
    </AriaForm>
  );
};
