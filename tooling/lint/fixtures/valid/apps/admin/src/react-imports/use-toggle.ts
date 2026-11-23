import { useState } from "react";

/** 切り替えの状態。 */
const useToggleState = () => useState(false);

export { useToggleState as useToggle };
