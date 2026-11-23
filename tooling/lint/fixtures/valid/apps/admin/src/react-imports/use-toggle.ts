import { useState } from "react";

/** 切り替えの状態。 */
const useToggleState = (() => useState(false)) satisfies () => unknown;

export { useToggleState as useToggle };
