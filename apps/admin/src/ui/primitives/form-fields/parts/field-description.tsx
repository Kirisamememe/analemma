import type { ReactNode } from "react";
import { Text } from "react-aria-components";

import { typography } from "@/ui/typography";

/** 入力欄の補足に渡す値。 */
type FieldDescriptionProps = {
  /** 補足の文言。 */
  children: string;
};

/** 入力欄の補足。 */
export const FieldDescription = ({
  children,
}: FieldDescriptionProps): ReactNode => (
  <Text
    className={typography({ role: "caption", className: "text-fg-muted" })}
    slot="description"
  >
    {children}
  </Text>
);
