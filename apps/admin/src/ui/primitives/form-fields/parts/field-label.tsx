import type { ReactNode } from "react";
import { Label } from "react-aria-components";

import { NecessityBadge } from "./necessity-badge";

import { typography } from "@/ui/typography";

/** 入力欄のラベルに渡す値。 */
type FieldLabelProps = {
  /** ラベルの文言。 */
  children: string;
  /** 入力が要ることを示す文言。 */
  requiredLabel?: string | undefined;
  /** 入力が任意であることを示す文言。 */
  optionalLabel?: string | undefined;
};

/** 入力欄のラベル。 */
export const FieldLabel = ({
  children,
  requiredLabel,
  optionalLabel,
}: FieldLabelProps): ReactNode => {
  const shownOptionalLabel =
    requiredLabel === undefined ? optionalLabel : undefined;

  return (
    <Label
      className={typography({
        role: "label",
        className: "flex items-start gap-2 text-fg",
      })}
    >
      <span className="min-w-0 wrap-anywhere">{children}</span>
      {requiredLabel !== undefined && (
        <NecessityBadge necessity="required">{requiredLabel}</NecessityBadge>
      )}
      {shownOptionalLabel !== undefined && (
        <NecessityBadge necessity="optional">
          {shownOptionalLabel}
        </NecessityBadge>
      )}
    </Label>
  );
};
