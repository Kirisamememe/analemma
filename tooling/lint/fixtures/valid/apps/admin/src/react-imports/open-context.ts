import { type Context, createContext as makeContext } from "react";

import type { OpenState } from "./open-state";

export { type Context } from "react";

/** 開け閉めを子に渡す値。 */
export type OpenContextValue = OpenState | undefined;

export const OpenContext = makeContext<OpenContextValue>(
  undefined,
) satisfies Context<OpenContextValue>;
