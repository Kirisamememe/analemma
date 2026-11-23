import { createRef, useState } from "react";

import { useShowToast } from "@/ui/primitives/overlays/hooks/use-show-toast";

/** 失敗の Toast を出す関数と、閉じる関数を返す。 */
export const useFailureToast = (id?: string) => {
  const showToast = useShowToast();

  const [owner, setOwner] = useState(() => ({
    id,
    closeShownRef: createRef<() => void>(),
  }));

  if (owner.id !== id) setOwner({ id, closeShownRef: createRef() });

  const { closeShownRef } = owner;

  const close = (): void => {
    closeShownRef.current?.();
    closeShownRef.current = null;
  };

  return {
    show: (message: string): void => {
      close();
      closeShownRef.current = showToast({ tone: "danger", message });
    },
    close,
  };
};
