import type { ReactNode } from "react";
import { FieldError, Label, Text } from "react-aria-components";
import { useTranslation } from "react-i18next";

import { Badge } from "@/ui/primitives/badge";
import { typography } from "@/ui/typography";

/** 入力欄の文言。 */
type FieldTextProps = {
  /** ラベルまたは補足の文言。 */
  children: string;
};

/** 入力が要ることを示すラベル。 */
export const RequiredBadge = (): ReactNode => {
  const { t } = useTranslation();

  return (
    <span aria-hidden="true" className="flex shrink-0">
      <Badge tone="neutral">{t("ui.required")}</Badge>
    </span>
  );
};

/** 入力欄のラベルに渡す値。 */
type FieldLabelProps = FieldTextProps & {
  /** 入力が要るか。 */
  isRequired?: boolean | undefined;
};

/** 入力欄のラベル。 */
export const FieldLabel = ({
  children,
  isRequired = false,
}: FieldLabelProps): ReactNode => (
  <Label
    className={typography({
      role: "label",
      className: "flex items-start gap-2 text-fg",
    })}
  >
    <span className="min-w-0 wrap-anywhere">{children}</span>
    {isRequired && <RequiredBadge />}
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
