import type { ReactNode } from "react";

import { tv } from "@/ui/tv";
import { typography } from "@/ui/typography";

const badge = tv({
  base: "inline-flex items-center rounded-xs border px-1.5",
  variants: {
    tone: {
      neutral: "border-line text-fg-muted",
      info: "border-info bg-info/10 text-info",
      success: "border-success bg-success/10 text-success",
      warning: "border-warning bg-warning/10 text-warning",
      danger: "border-danger bg-danger/10 text-danger",
    },
  },
});

/** バッジに渡す値。 */
type BadgeProps = {
  /** バッジの用途。 */
  tone: "neutral" | "info" | "success" | "warning" | "danger";
  /** バッジの文言。 */
  children: ReactNode;
};

/** 状態を短く示すバッジ。 */
export const Badge = ({ tone, children }: BadgeProps): ReactNode => (
  <span className={badge({ tone, className: typography({ role: "caption" }) })}>
    {children}
  </span>
);
