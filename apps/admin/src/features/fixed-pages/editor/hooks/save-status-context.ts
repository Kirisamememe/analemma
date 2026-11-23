import { createContext } from "react";

/** 固定ページの保存中と、作成・更新が終わったときの表示。 */
export type SaveStatus = "pending" | "created" | "saved" | undefined;

export const SaveStatusContext = createContext<
  ((status: SaveStatus) => void) | undefined
>(undefined);
