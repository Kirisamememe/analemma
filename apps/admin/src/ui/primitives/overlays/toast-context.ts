import { createContext } from "react";

/** Toast に出す知らせ。 */
export type ToastMessage = {
  /** 知らせの用途。 */
  readonly tone: "success" | "danger";
  /** 訳した文。 */
  readonly message: string;
};

/** 出した Toast を閉じる関数。 */
type CloseToast = () => void;

/** 知らせを Toast に出す関数。 */
export type ShowToast = (message: ToastMessage) => CloseToast;

export const ShowToastContext = createContext<ShowToast | undefined>(undefined);
