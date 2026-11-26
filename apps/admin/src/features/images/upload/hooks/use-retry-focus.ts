import { useCallback, useRef } from "react";

import type { PhotoUpload } from "@/features/images/upload/logic/photo-uploads";
import { focusAfterRetry } from "@/features/images/upload/logic/upload-view";

/** 送り直しと結果を閉じる操作と、その後に focus を引き継ぐ先。 */
type RetryFocusOptions = {
  /** 写真を送り直す関数。 */
  readonly retry: (id: number) => void;
  /** 送り終えた写真の結果を閉じる関数。 */
  readonly clear: () => void;
};

/** 送り直しや結果を閉じる操作で押したボタンが消えても、focus を次の操作へ引き継ぐ。 */
export const useRetryFocus = ({ retry, clear }: RetryFocusOptions) => {
  const addButton = useRef<HTMLButtonElement>(null);
  const retrying = useRef<number>(undefined); // 送り直しが済んだら focus を移す写真

  const retryWithFocus = useCallback(
    (id: number): void => {
      retrying.current = id;
      retry(id);
    },
    [retry],
  );

  const clearWithFocus = useCallback((): void => {
    clear();
    addButton.current?.focus();
  }, [clear]);

  const restore = useCallback(
    (row: HTMLLIElement | null, upload: PhotoUpload): void => {
      const target = focusAfterRetry(upload);

      if (
        row === null ||
        retrying.current !== upload.id ||
        target === undefined
      ) {
        return;
      }

      retrying.current = undefined;

      if (document.activeElement !== document.body) return; // 待つ間に自分で動かした focus は保つ

      (target === "result"
        ? row.querySelector("a")
        : addButton.current
      )?.focus();
    },
    [],
  );

  return { addButton, retry: retryWithFocus, clear: clearWithFocus, restore };
};
