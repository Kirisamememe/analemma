import type { ReactNode } from "react";

/** 待っていることを示す spinner(スクリーンリーダーには出さない)。 */
export const Spinner = (): ReactNode => (
  <span
    aria-hidden="true"
    className="block size-icon animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-pulse"
  />
);
