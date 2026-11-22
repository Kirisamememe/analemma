import type { ReactNode } from "react";
import { FocusScope as AriaFocusScope } from "react-aria";

/** `FocusScope` に渡す値。 */
type FocusScopeProps = {
  /** 中身。 */
  readonly children: ReactNode;
};

/** 中から開いた Dialog の、focus の戻り先になる範囲。 */
export const FocusScope = ({ children }: FocusScopeProps): ReactNode => (
  <AriaFocusScope>{children}</AriaFocusScope>
);
