import { type RefObject, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";

import type { NeighborIds } from "@/features/images/detail/logic/viewer-progress";
import type { Neighbor } from "@/features/images/ui/image-viewer";

type PhotoSide = "previous" | "next";

type PendingFocus = {
  /** キーボードで開く写真の ID。 */
  id: string;
  /** 押したリンクの向き。 */
  side: PhotoSide;
};

/** 前後の矢印に渡す画像と、移れるか。 */
type NavigationTargets = Partial<NeighborIds> & {
  /** 次の写真を待っていて、移動を受け付けないか。 */
  readonly disabled: boolean;
};

/** キーボードで開いた写真で、同じ向きのリンクへ focus を戻す。 */
export const useViewerNavigation = (
  back: RefObject<HTMLAnchorElement | null>,
  { previous: previousId, next: nextId, disabled }: NavigationTargets,
) => {
  const { t } = useTranslation();
  const previous = useRef<HTMLAnchorElement>(null);
  const next = useRef<HTMLAnchorElement>(null);
  const pending = useRef<PendingFocus>(undefined);
  const retryRef = useRef<HTMLButtonElement>(null);

  const neighbors = useMemo(() => {
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

    return {
      previous: neighbor("previous", previousId),
      next: neighbor("next", nextId),
    };
  }, [previousId, nextId, disabled, t, previous, next, pending]); // 写真を送るときと、待つ間だけ、矢印のリンクを作り直す

  const restore = (id: string) => {
    const move = pending.current;

    if (move?.id !== id) return;

    const active = document.activeElement;

    if (active !== null && active !== document.body) {
      if (active !== retryRef.current) pending.current = undefined;

      return;
    }

    if (retryRef.current !== null) {
      retryRef.current.focus();
      return;
    }

    pending.current = undefined;

    const opposite = move.side === "previous" ? next : previous;
    const same = move.side === "previous" ? previous : next;
    (same.current ?? opposite.current ?? back.current)?.focus();
  };

  const retry = (id: string, again: () => void) => {
    if (pending.current?.id !== id) pending.current = { id, side: "next" };

    again();
  };

  return { ...neighbors, restore, retry, retryRef };
};
