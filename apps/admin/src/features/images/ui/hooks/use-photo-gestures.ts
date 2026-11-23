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

type GestureOptions = {
  /** スワイプを始める写真の ID。 */
  photoId?: string | undefined;
  /** 写真や情報を取得しているか。 */
  disabled?: boolean;
};

/** 写真のタップとスワイプを扱う。 */
export const usePhotoGestures = (
  onSwipe: (direction: "previous" | "next") => void,
  { photoId, disabled = false }: GestureOptions = {},
) => {
  const touch = useRef<{
    /** 指を置いたときのイベント。 */
    event: PhotoPointer;
    /** 指を置いた写真の ID。 */
    photoId: string | undefined;
  }>(undefined);

  const [controlsVisible, setControlsVisible] = useState(false);

  const onPointerDown = (event: PhotoPointer) => {
    touch.current = undefined;

    if (
      disabled ||
      !event.isPrimary ||
      event.pointerType === "mouse" ||
      (event.target instanceof Element && event.target.closest("a, button"))
    ) {
      return;
    }

    touch.current = { event, photoId };
  };

  const onPointerCancel = () => {
    touch.current = undefined;
  };

  const onPointerUp = (event: PhotoPointer) => {
    const origin = touch.current;
    const start = origin?.event;

    touch.current = undefined;

    if (
      disabled ||
      origin?.photoId !== photoId ||
      start?.pointerId !== event.pointerId
    ) {
      return;
    }

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
