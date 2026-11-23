import { useRef } from "react";

import { useShowToast } from "@/ui/primitives/overlays/use-show-toast";

/** 失敗の Toast を出す関数と、閉じる関数を返す。 */
export const useFailureToast = () => {
  const showToast = useShowToast();
  const closeShown = useRef<() => void>(undefined);
  const close = (): void => {
    closeShown.current?.();
    closeShown.current = undefined;
  };

  return {
    show: (message: string): void => {
      close();
      closeShown.current = showToast({ tone: "danger", message });
    },
    close,
  };
};
