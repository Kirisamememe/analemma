import type { Dispatch, SetStateAction } from "react";

/** 開いているかどうかと、それを変える関数。 */
export type OpenState = [boolean, Dispatch<SetStateAction<boolean>>];
