import { type KeyboardEvent, useCallback, useRef } from "react";

const TAKEOVERS = ["pointerdown", "wheel", "touchstart", "keydown"] as const; // 利用者がスクロールを引き取った
const ALIGNED_WITHIN = 2; // 左端からのずれ(px)が、これより小さければ寄せ終えたとする

type FrameRef = (frame: HTMLElement | null) => (() => void) | undefined; // React が、返した関数で片付ける

const prefersInstant = (): boolean =>
  globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches;

const offsetFromStart = (rail: HTMLElement, tile: Element): number => {
  const inset = Number(
    getComputedStyle(rail).scrollPaddingInlineStart.replace("px", ""),
  );

  return (
    tile.getBoundingClientRect().left -
    rail.getBoundingClientRect().left -
    (Number.isNaN(inset) ? 0 : inset)
  );
};

type SelectionOptions = {
  /** 選択中の写真の番号。 */
  selectedId: number;
  /** 写真を選ぶ関数。 */
  onSelect: (id: number) => void;
};

/** カルーセルの選択・focus・写真の列のスクロールをそろえる。 */
export const useCarouselSelection = <T extends Record<"id", number>>(
  photos: readonly T[],
  { selectedId, onSelect }: SelectionOptions,
) => {
  const rail = useRef<HTMLElement | null>(null);
  const selected = useRef<HTMLButtonElement | null>(null);
  const focusId = useRef<number | undefined>(undefined);
  const frames = useRef(new Map<Element, number>());
  const frameRefs = useRef(new Map<number, FrameRef>());
  const resizes = useRef<ResizeObserver | undefined>(undefined);
  const detachRail = useRef<(() => void) | undefined>(undefined);
  const settling = useRef(true); // 選択中の写真へ寄せている間は、止まった場所の写真を選ばない
  const scrolledTo = useRef<number | undefined>(undefined); // スクロールで選んだ写真は、寄せ直さない
  const current = useRef({ selectedId, onSelect }); // 選択中の写真の要素を付け替えるたびに、新しい値を入れる
  const index = photos.findIndex(({ id }) => id === selectedId);

  const align = useCallback((behavior: ScrollBehavior): void => {
    if (!rail.current || !selected.current) return;

    const left = offsetFromStart(rail.current, selected.current);

    settling.current = Math.abs(left) >= ALIGNED_WITHIN;

    if (settling.current) rail.current.scrollBy({ left, behavior });
  }, []);

  const selectAligned = useCallback((): void => {
    const viewport = rail.current;

    if (viewport === null) return;

    const [nearest] = [...frames.current].toSorted(
      ([a], [b]) =>
        Math.abs(offsetFromStart(viewport, a)) -
        Math.abs(offsetFromStart(viewport, b)),
    );

    if (nearest === undefined || nearest[1] === current.current.selectedId) {
      return;
    }

    if (viewport.contains(document.activeElement)) focusId.current = nearest[1]; // 写真にあった focus は、選び直した写真へ連れていく

    [, scrolledTo.current] = nearest;
    current.current.onSelect(nearest[1]);
  }, []);

  const attachRail = useCallback(
    (element: HTMLElement | null): void => {
      detachRail.current?.();
      detachRail.current = undefined;
      rail.current = element;

      if (element === null) return;

      const takeOver = (): void => {
        settling.current = false;
      };

      const arrive = (): void => {
        if (settling.current) align("instant"); // 途中で止まったら、選んだ写真へ寄せ直す
        else selectAligned();
      };

      const resized = new ResizeObserver(() => {
        align("instant"); // 写真の幅が変わっても、選択中の写真を左端に保つ
      });

      resizes.current = resized;

      for (const frame of frames.current.keys()) resized.observe(frame);

      const region = element.parentElement ?? element; // スクロールバーの操作も、引き取りに数える

      for (const type of TAKEOVERS) {
        region.addEventListener(type, takeOver, { passive: true });
      }

      element.addEventListener("scrollend", arrive);
      align("instant");

      detachRail.current = () => {
        resized.disconnect();

        for (const type of TAKEOVERS) {
          region.removeEventListener(type, takeOver);
        }

        element.removeEventListener("scrollend", arrive);
        resizes.current = undefined;
      };
    },
    [align, selectAligned],
  );

  const attachFrame = useCallback((id: number): FrameRef => {
    const known = frameRefs.current.get(id);

    if (known) return known;

    const attach: FrameRef = (frame) => {
      if (frame === null) return;

      frames.current.set(frame, id);
      resizes.current?.observe(frame);

      return () => {
        frames.current.delete(frame);
        resizes.current?.unobserve(frame);
      };
    };

    frameRefs.current.set(id, attach);

    return attach;
  }, []);

  const attachSelected = useCallback(
    (button: HTMLButtonElement | null) => {
      selected.current = button;
      current.current = { selectedId, onSelect };

      if (button === null) return;

      if (focusId.current === selectedId) {
        button.focus({ preventScroll: true });
        focusId.current = undefined;
      }

      if (scrolledTo.current === selectedId) {
        scrolledTo.current = undefined;

        return;
      }

      align(prefersInstant() ? "instant" : "smooth");
    },
    [align, onSelect, selectedId],
  );

  const selectAt = (target: number): void => {
    const photo = photos[target];

    if (!photo || photo.id === selectedId) return;

    focusId.current = photo.id;
    onSelect(photo.id);
  };

  const move = (event: Pick<KeyboardEvent, "key" | "preventDefault">): void => {
    const targets: Partial<Record<string, number>> = {
      ArrowLeft: index - 1,
      ArrowRight: index + 1,
      Home: 0,
      End: photos.length - 1,
    };

    const target = targets[event.key];

    if (target === undefined) return;

    event.preventDefault();
    selectAt(target);
  };

  return {
    selectedPhoto: photos[index],
    index,
    attachRail,
    attachFrame,
    attachSelected,
    move,
    previous: () => {
      selectAt(index - 1);
    },
    next: () => {
      selectAt(index + 1);
    },
  };
};
