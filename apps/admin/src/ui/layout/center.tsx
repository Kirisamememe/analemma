import type { ReactNode } from "react";

import { tv } from "@/ui/tv";

const center = tv({
  base: "mx-auto w-full px-4",
  variants: {
    width: {
      sm: "max-w-sm",
      md: "max-w-md",
      form: "max-w-form",
      nestedForm: "@container/nested-form max-w-form @max-3xs:px-0",
      page: "max-w-page",
    },
  },
});

/** 中身を真ん中に寄せる箱に渡す値。 */
type CenterProps = {
  /** 中身の幅の上限。 */
  width: "sm" | "md" | "form" | "nestedForm" | "page";
  /** 寄せる中身。 */
  children: ReactNode;
};

/** 中身の幅を絞り、左右の真ん中に寄せる箱。 */
export const Center = ({ width, children }: CenterProps): ReactNode => (
  <div className={center({ width })}>{children}</div>
);
