import { useContext } from "react";

import {
  type ShowToast,
  ShowToastContext,
} from "@/ui/primitives/overlays/toast/toast-context";

/** Toast を出す関数を返す hook。 */
export const useShowToast = (): ShowToast => {
  const showToast = useContext(ShowToastContext);

  if (showToast === undefined) {
    throw new Error("useShowToast は ToastProvider の中で呼んでください。");
  }

  return showToast;
};
