import type { ReactNode } from "react";
import { FieldError, Label, Text } from "react-aria-components";

import { typography } from "@/ui/typography";

/** 入力欄の文言。 */
type FieldTextProps = {
  /** ラベルまたは補足の文言。 */
  readonly children: string;
};

/** 入力欄のラベル。 */
export const FieldLabel = ({ children }: FieldTextProps): ReactNode => (
  <Label className={typography({ role: "label", className: "text-fg" })}>
    {children}
  </Label>
);

/** 入力欄の補足。 */
export const FieldDescription = ({ children }: FieldTextProps): ReactNode => (
  <Text
    className={typography({ role: "caption", className: "text-fg-muted" })}
    slot="description"
  >
    {children}
  </Text>
);

type FieldErrorMessageProps = {
  /** 呼び出し元から渡す誤りの知らせ。 */
  readonly children?: string | undefined;
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
