import { useState } from "react";

import type { OpenState } from "./open-state";

/** 開いているかどうかの状態。 */
export const useOpen = (): OpenState => useState(false);
