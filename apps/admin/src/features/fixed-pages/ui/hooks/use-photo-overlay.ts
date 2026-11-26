import {
  type FocusEvent,
  type MouseEvent,
  type PointerEvent,
  useCallback,
  useRef,
  useState,
} from "react";

/** 写真の上の操作を、マウスとタッチそれぞれの入力で開閉する。 */
export const usePhotoOverlay = () => {
  const firstTap = useRef(false);
  const [input, setInput] = useState<"mouse" | "touch" | null>(null);

  const frame = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node || input !== "touch") return undefined;

      const dismiss = (event: Event) => {
        if (!event.composedPath().includes(node)) setInput(null);
      };

      const document = node.ownerDocument;
      document.addEventListener("pointerdown", dismiss, true);
      document.addEventListener("focusin", dismiss, true);

      return () => {
        document.removeEventListener("pointerdown", dismiss, true);
        document.removeEventListener("focusin", dismiss, true);
      };
    },
    [input],
  );

  const hover = (event: PointerEvent) => {
    if (event.pointerType === "mouse") setInput("mouse");
  };

  const leave = (event: PointerEvent) => {
    if (event.pointerType === "mouse") setInput(null);
  };

  const press = (event: PointerEvent) => {
    firstTap.current =
      (event.pointerType === "touch" || event.pointerType === "pen") &&
      input !== "touch";

    if (firstTap.current) event.stopPropagation();
  };

  const reveal = (event: MouseEvent) => {
    if (!firstTap.current || event.detail === 0) return;

    firstTap.current = false;
    event.preventDefault();
    event.stopPropagation();
    setInput("touch");
  };

  const blur = (event: FocusEvent<HTMLDivElement>) => {
    if (
      input === "touch" &&
      !event.currentTarget.contains(event.relatedTarget)
    ) {
      setInput(null);
    }
  };

  return { frame, open: input !== null, hover, leave, press, reveal, blur };
};
