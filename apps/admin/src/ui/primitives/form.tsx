import type { ReactNode, Ref } from "react";
import {
  Form as AriaForm,
  type FormProps as AriaFormProps,
} from "react-aria-components";

const NO_ERRORS: Readonly<Record<string, string>> = {};

/** フォームに渡す値。 */
type FormProps = {
  /** 送ったときに、入力をまとめて受け取る関数。 */
  onSubmit: (data: FormData) => void;
  /** 送信中か(送信中は、Enter で送り直させない)。 */
  isPending?: boolean;
  /** server が断った入力ごとの、誤りの知らせ。 */
  validationErrors?: Readonly<Record<string, string>>;
  /** フォームの要素(最初の誤りの欄へ focus を移すときに使う)。 */
  ref?: Ref<HTMLFormElement>;
  /** 入力欄とボタン。 */
  children: ReactNode;
};

/** 入力欄をまとめて送るフォーム。 */
export const Form = ({
  onSubmit,
  isPending = false,
  validationErrors = NO_ERRORS,
  ref,
  children,
}: FormProps): ReactNode => {
  const submit: NonNullable<AriaFormProps["onSubmit"]> = (event) => {
    event.preventDefault();

    if (!isPending) {
      onSubmit(new FormData(event.currentTarget));
    }
  };

  return (
    <AriaForm
      className="flex flex-col gap-4"
      onSubmit={submit}
      ref={ref}
      validationErrors={validationErrors}
    >
      {children}
    </AriaForm>
  );
};
