import { type RefObject, useRef } from "react";
import { useTranslation } from "react-i18next";

import type { Neighbor } from "@/features/images/ui/image-viewer";

type PhotoSide = "previous" | "next";

type PendingFocus = {
  /** キーボードで開く写真の ID。 */
  id: string;
  /** 押したリンクの向き。 */
  side: PhotoSide;
};

/** 画面に出ている、focus を戻せる先。 */
type FocusTargets = Record<PhotoSide, boolean> & {
  /** 「もう一度試す」のボタンが出ているか。 */
  retry: boolean;
};

/** キーボードで開いた写真で、同じ向きのリンクへ focus を戻す。 */
export const useViewerNavigation = (
  back: RefObject<HTMLAnchorElement | null>,
  disabled: boolean,
) => {
  const { t } = useTranslation();
  const previous = useRef<HTMLAnchorElement>(null);
  const next = useRef<HTMLAnchorElement>(null);
  const pending = useRef<PendingFocus>(undefined);
  const retryRef = useRef<HTMLButtonElement>(null);
  const links = { previous, next };

  const neighbor = (
    side: PhotoSide,
    id: string | undefined,
  ): Neighbor | undefined =>
    id === undefined
      ? undefined
      : {
          href: `/images/${id}`,
          disabled,
          label: t(
            side === "next" ? "imageDetail.next" : "imageDetail.previous",
          ),
          attach: (element) => {
            links[side].current = element;
          },
          onKeyboardNavigate: () => {
            pending.current = { id, side };
          },
        };

  const restore = (id: string, shown: FocusTargets) => {
    const move = pending.current;

    if (move?.id !== id) return;

    const active = document.activeElement;

    if (active !== null && active !== document.body) {
      if (active !== retryRef.current) pending.current = undefined;

      return;
    }

    if (shown.retry) {
      retryRef.current?.focus();
      return;
    }

    pending.current = undefined;

    const opposite = move.side === "previous" ? "next" : "previous";
    const sides = [move.side, opposite] as const;
    const side = sides.find((candidate) => shown[candidate]);

    (side === undefined ? back.current : links[side].current)?.focus();
  };

  const retry = (id: string, again: () => void) => {
    if (pending.current?.id !== id) pending.current = { id, side: "next" };

    again();
  };

  return { neighbor, restore, retry, retryRef };
};
