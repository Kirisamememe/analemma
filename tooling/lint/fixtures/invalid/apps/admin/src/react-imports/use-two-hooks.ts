import { useState } from "react";

/** 開いているかどうかの状態。 */
export const useOpen = () => useState(false);

/** 選んでいるかどうかの状態。 */
export const useSelected = () => useState(false);
