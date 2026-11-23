import { type PointerEvent, useRef, useState } from "react";

import { toSwipe } from "../logic/swipe";

type PhotoPointer = Pick<
  PointerEvent,
  | "isPrimary"
  | "pointerType"
  | "target"
  | "pointerId"
  | "clientX"
  | "clientY"
  | "timeStamp"
>;

/** 写真のタップとスワイプを扱う。 */
export const usePhotoGestures = (
  onSwipe: (direction: "previous" | "next") => void,
) => {
  const touch = useRef<PhotoPointer>(undefined);
  const [controlsVisible, setControlsVisible] = useState(false);

  const onPointerDown = (event: PhotoPointer) => {
    touch.current = undefined;

    if (
      !event.isPrimary ||
      event.pointerType === "mouse" ||
      (event.target instanceof Element && event.target.closest("a, button"))
    ) {
      return;
    }

    touch.current = event;
  };

  const onPointerCancel = () => {
    touch.current = undefined;
  };

  const onPointerUp = (event: PhotoPointer) => {
    const start = touch.current;

    touch.current = undefined;

    if (start?.pointerId !== event.pointerId) return;

    const dx = event.clientX - start.clientX;
    const dy = event.clientY - start.clientY;
    const duration = event.timeStamp - start.timeStamp;
    const direction = toSwipe({ dx, dy, duration });

    if (direction !== undefined) onSwipe(direction);
    else if (Math.hypot(dx, dy) <= 10 && duration < 500) {
      setControlsVisible((visible) => !visible);
    }
  };

  return {
    controlsVisible,
    handlers: { onPointerDown, onPointerCancel, onPointerUp },
  };
};
