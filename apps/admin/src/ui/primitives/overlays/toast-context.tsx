import { createContext, useContext } from "react";

/** Toast に出す知らせ。 */
export type ToastMessage = {
  /** 知らせの用途。 */
  readonly tone: "success" | "danger";
  /** 訳した文。 */
  readonly message: string;
};

type ShowToast = (message: ToastMessage) => void;

export const ShowToastContext = createContext<ShowToast | undefined>(undefined);

/** Toast を出す関数を返す hook。 */
export const useShowToast = (): ShowToast => {
  const showToast = useContext(ShowToastContext);

  if (showToast === undefined) {
    throw new Error("useShowToast は ToastProvider の中で呼んでください。");
  }

  return showToast;
};
