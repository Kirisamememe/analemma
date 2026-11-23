import { createContext } from "react";

import type { OpenState } from "./open-state";

/** 開け閉めを子に渡す値。 */
export type OpenContextValue = OpenState | undefined;

export const OpenContext = createContext<OpenContextValue>(undefined);
