import type { ReactNode } from "react";
import { Button } from "react-aria-components";

import { tv } from "@/ui/tv";

const stepButton = tv({
  base: [
    "flex shrink-0 items-center justify-center",
    "border-s px-2 outline-hidden transition-colors",
    "is-hovered:state-hover is-focus-shown:focus-ring-inset is-disabled:text-fg-muted",
  ],
});

/** 増減ボタンに渡す値。 */
type StepButtonProps = {
  /** React Aria Components の slot。 */
  slot: "decrement" | "increment";
};

/** 数値を1段ずつ増減するボタン。 */
export const StepButton = ({ slot }: StepButtonProps): ReactNode => (
  <Button className={stepButton()} slot={slot}>
    <svg
      aria-hidden="true"
      className="size-icon"
      fill="none"
      viewBox="0 0 16 16"
    >
      <path
        d={slot === "increment" ? "M4 8h8M8 4v8" : "M4 8h8"}
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  </Button>
);
