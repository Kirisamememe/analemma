import type { ReactNode } from "react";
import { FieldError, Label, Text } from "react-aria-components";

import { typography } from "../../typography";

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

/** 入力欄の誤りの知らせ。 */
export const FieldErrorMessage = (): ReactNode => (
  <FieldError
    className={typography({ role: "caption", className: "text-danger" })}
  />
);
