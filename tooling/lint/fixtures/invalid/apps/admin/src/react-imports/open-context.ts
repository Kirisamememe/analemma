import { createContext, useContext } from "react";

export const OpenContext = createContext<boolean>(false);

/** 開いているかどうかを読む hook。 */
export const useIsOpen = () => useContext(OpenContext);
