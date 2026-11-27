import type { ReactNode } from "react";
import { Label } from "react-aria-components";

import { RequiredBadge } from "./required-badge";

import { typography } from "@/ui/typography";

/** 入力欄のラベルに渡す値。 */
type FieldLabelProps = {
  /** ラベルの文言。 */
  children: string;
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
