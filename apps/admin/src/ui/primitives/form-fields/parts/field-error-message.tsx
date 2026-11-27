import type { ReactNode } from "react";
import { FieldError } from "react-aria-components";

import { typography } from "@/ui/typography";

/** 入力欄の誤りの知らせに渡す値。 */
type FieldErrorMessageProps = {
  /** 呼び出し元から渡す誤りの知らせ。 */
  children?: string | undefined;
};

/** 入力欄の誤りの知らせ。 */
export const FieldErrorMessage = ({
  children,
}: FieldErrorMessageProps): ReactNode => (
  <FieldError
    className={typography({ role: "caption", className: "text-danger" })}
  >
    {children}
  </FieldError>
);
