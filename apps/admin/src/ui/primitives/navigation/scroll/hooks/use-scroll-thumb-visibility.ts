import { useCallback, useState } from "react";

const HIDE_DELAY = 5000;

/** スクロールバーのつまみの表示状態を管理する。 */
export const useScrollThumbVisibility = () => {
  const [visible, setVisible] = useState(false);

  const attach = useCallback((element: HTMLDivElement | null) => {
    if (!element) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const pointers = new Set<number>();

    const enter = (event: PointerEvent): void => {
      clearTimeout(timer);
      pointers.add(event.pointerId);
      setVisible(true);
    };

    const leave = (event: PointerEvent): void => {
      pointers.delete(event.pointerId);

      if (pointers.size > 0) return;

      clearTimeout(timer);
      timer = setTimeout(() => {
        setVisible(false);
      }, HIDE_DELAY);
    };

    element.addEventListener("pointerenter", enter);
    element.addEventListener("pointerleave", leave);

    return () => {
      clearTimeout(timer);
      element.removeEventListener("pointerenter", enter);
      element.removeEventListener("pointerleave", leave);
    };
  }, []);

  return { attach, visible };
};
