import { type RefObject, useCallback, useRef } from "react";

type PendingFocus = {
  /** 取得後に focus を渡すページの番号。 */
  page: number;
  /** 取得を始めたときの focus。 */
  from: Element | null;
};

type ListFocus = {
  /** 先頭の入力欄かリンクに focus を戻せるか。 */
  first: boolean;
  /** 最後の入力欄かリンクに focus を戻す対象のページ。 */
  lastPage: number | undefined;
};

/** 読み込みの後、操作した場所から結果へ focus を移す。 */
export const useImagePageFocus = (
  fallback?: RefObject<HTMLButtonElement | null>,
) => {
  const pendingFocus = useRef<PendingFocus>(undefined);

  const rememberFocus = (page: number): void => {
    pendingFocus.current = { page, from: document.activeElement };
  };

  const focusResult = useCallback(
    (page: number, element: HTMLElement | null): void => {
      const pending = pendingFocus.current;

      if (
        element === null ||
        pending?.page !== page ||
        element === pending.from
      ) {
        return;
      }

      pendingFocus.current = undefined;
      const active = document.activeElement;

      if (
        active === pending.from ||
        (active === document.body && pending.from?.isConnected === false)
      ) {
        element.focus();
      }
    },
    [],
  );

  const focusList = (
    list: HTMLUListElement | null,
    { first, lastPage }: ListFocus,
  ): void => {
    if (list === null) return;

    const selector = "a, input:not([disabled])";

    if (first) focusResult(0, list.querySelector<HTMLElement>(selector));

    if (lastPage !== undefined) {
      const last = Array.from(list.querySelectorAll<HTMLElement>(selector)).at(
        -1,
      );

      focusResult(lastPage, last ?? fallback?.current ?? null);
    }
  };

  return { rememberFocus, focusResult, focusList };
};
