import type { ReactNode } from "react";

/** 待っていることを示す、回る輪(読み上げには出さない)。 */
export const Spinner = (): ReactNode => (
  <span
    aria-hidden="true"
    className="size-icon animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-pulse"
  />
);
