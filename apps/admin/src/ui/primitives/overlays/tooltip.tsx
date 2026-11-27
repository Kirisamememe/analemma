import type { ReactNode } from "react";
import { Tooltip as AriaTooltip, TooltipTrigger } from "react-aria-components";

import { overlayPanel } from "./overlay-panel-style";

import { tv } from "@/ui/tv";
import { typography } from "@/ui/typography";

const tooltip = tv({
  base: [
    "z-overlay max-w-xs rounded-control px-2 py-1",
    overlayPanel(),
    typography({ role: "caption" }),
  ],
});

/** `Tooltip` に渡す値。 */
type TooltipProps = {
  /** 操作の名前として出す文言。 */
  label: string;
  /** 文言を添える、focus できる操作。 */
  children: ReactNode;
};

/** アイコンだけの操作に添える、操作の名前の吹き出し。 */
export const Tooltip = ({ label, children }: TooltipProps): ReactNode => (
  <TooltipTrigger closeDelay={0} delay={400}>
    {children}
    <AriaTooltip className={tooltip()} offset={6}>
      {label}
    </AriaTooltip>
  </TooltipTrigger>
);
