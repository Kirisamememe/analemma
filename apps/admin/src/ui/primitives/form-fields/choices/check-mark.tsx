import type { ReactNode } from "react";

/** 選んだときに見せる、チェックの印。 */
export const CheckMark = (): ReactNode => (
  <svg
    aria-hidden="true"
    className="size-icon shrink-0 opacity-0 transition-opacity group-is-selected:opacity-100"
    fill="none"
    viewBox="0 0 16 16"
  >
    <path
      d="M4.25 8.25 6.75 10.75l5-5.5"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.75"
    />
  </svg>
);
