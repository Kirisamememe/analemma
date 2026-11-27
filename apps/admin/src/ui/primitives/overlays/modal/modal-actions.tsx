import type { ReactNode } from "react";

import { tv } from "@/ui/tv";

const actions = tv({
  base: [
    "-m-2 inline-flex min-w-0 flex-wrap items-center gap-2",
    "rounded-surface modal-bar-backdrop p-2",
  ],
});

/** モーダルの下端の帯で、操作の背後にぼかしを掛けるまとまり。 */
export const ModalActions = ({
  children,
}: Readonly<Record<"children", ReactNode>>): ReactNode => (
  <div className={actions()}>{children}</div>
);
