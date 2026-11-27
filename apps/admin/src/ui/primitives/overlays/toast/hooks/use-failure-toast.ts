import { useCallback, useRef } from "react";

import { useShowToast } from "@/ui/primitives/overlays/toast/hooks/use-show-toast";

/** 対象の id ごとに、失敗の Toast を出す関数と、最後に出したものを閉じる関数を返す。 */
export const useFailureToast = (id?: string) => {
  const showToast = useShowToast();
  const shown = useRef(new Map<string | undefined, () => void>()); // id を替えても描き直さないよう、state にしない

  const close = useCallback((): void => {
    shown.current.get(id)?.();
    shown.current.delete(id);
  }, [id]);

  const show = useCallback(
    (message: string): void => {
      close();
      shown.current.set(id, showToast({ tone: "danger", message }));
    },
    [close, id, showToast],
  );

  return { show, close };
};
