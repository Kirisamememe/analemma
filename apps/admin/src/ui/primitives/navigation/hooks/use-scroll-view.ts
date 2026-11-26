import {
  type KeyboardEvent,
  type PointerEvent,
  useCallback,
  useRef,
  useState,
} from "react";

/** スクロールの方向。 */
export type ScrollOrientation = "horizontal" | "vertical";

const LINE_STEP = 40;

const AXES = {
  horizontal: {
    offset: "scrollLeft",
    extent: "scrollWidth",
    viewport: "clientWidth",
    size: "width",
    start: "left",
    coordinate: "clientX",
    delta: "deltaX",
    backward: "ArrowLeft",
    forward: "ArrowRight",
  },
  vertical: {
    offset: "scrollTop",
    extent: "scrollHeight",
    viewport: "clientHeight",
    size: "height",
    start: "top",
    coordinate: "clientY",
    delta: "deltaY",
    backward: "ArrowUp",
    forward: "ArrowDown",
  },
} as const;

type Drag = {
  /** 操作中の pointer の ID。 */
  id: number;
  /** つまみを押した位置からその先頭までの距離。 */
  grab: number;
};

/** スクロール領域の寸法と、スクロールバーの操作。 */
export const useScrollView = (
  orientation: ScrollOrientation,
  viewportRef?: (element: HTMLDivElement | null) => void,
) => {
  const axis = AXES[orientation];
  const viewport = useRef<HTMLDivElement | null>(null);
  const content = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const [metrics, setMetrics] = useState({ thumbFraction: 1, position: 0 });

  const measure = useCallback(() => {
    const element = viewport.current;

    if (!element) return;

    const length = element[axis.extent];
    const visible = element[axis.viewport];
    const limit = length - visible;
    const thumbFraction = limit > 0 && visible > 0 ? visible / length : 1;

    const position =
      limit > 0 ? Math.min(1, Math.max(0, element[axis.offset] / limit)) : 0;

    setMetrics((previous) =>
      previous.thumbFraction === thumbFraction && previous.position === position
        ? previous
        : { thumbFraction, position },
    );
  }, [axis]);

  const attach = useCallback(
    (element: HTMLDivElement | null) => {
      if (!element) return;

      viewport.current = element;
      viewportRef?.(element);
      const observer = new ResizeObserver(measure);
      observer.observe(element);

      if (content.current) observer.observe(content.current);

      measure();

      return () => {
        observer.disconnect();
        viewport.current = null;
        viewportRef?.(null);
      };
    },
    [measure, viewportRef],
  );

  const attachTrack = useCallback(
    (track: HTMLDivElement | null) => {
      if (!track) return;

      const onWheel = (event: WheelEvent): void => {
        const element = viewport.current;

        if (
          !element ||
          event.ctrlKey ||
          (event.shiftKey && orientation === "vertical")
        ) {
          return;
        }

        const delta =
          event.shiftKey && orientation === "horizontal"
            ? event.deltaY || event.deltaX
            : event[axis.delta];

        if (delta === 0) return;

        const unit =
          event.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ? element[axis.viewport]
            : event.deltaMode === WheelEvent.DOM_DELTA_LINE
              ? LINE_STEP
              : 1;

        event.preventDefault();
        element[axis.offset] += delta * unit;
      };

      track.addEventListener("wheel", onWheel, { passive: false });

      return () => {
        track.removeEventListener("wheel", onWheel);
      };
    },
    [axis, orientation],
  );

  const scrollTo = (position: number): void => {
    const element = viewport.current;

    if (!element) return;

    element[axis.offset] = Math.max(
      0,
      Math.min(element[axis.extent] - element[axis.viewport], position),
    );
    measure();
  };

  const movePointer = (event: PointerEvent<HTMLDivElement>): void => {
    const active = drag.current;
    const element = viewport.current;
    const handle = thumb.current;

    if (!active || active.id !== event.pointerId || !handle || !element) return;

    const track = event.currentTarget.getBoundingClientRect();
    const travel = track[axis.size] - handle.getBoundingClientRect()[axis.size];

    if (travel <= 0) return;

    const fraction =
      (event[axis.coordinate] - track[axis.start] - active.grab) / travel;

    scrollTo(fraction * (element[axis.extent] - element[axis.viewport]));
  };

  const startPointer = (event: PointerEvent<HTMLDivElement>): void => {
    const handle = thumb.current;

    if (!handle || event.button !== 0 || !event.isPrimary) return;

    const box = handle.getBoundingClientRect();
    const distance = event[axis.coordinate] - box[axis.start];

    const grab =
      distance >= 0 && distance <= box[axis.size]
        ? distance
        : box[axis.size] / 2;

    drag.current = { id: event.pointerId, grab };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.focus({ preventScroll: true });
    movePointer(event);
  };

  const endPointer = (event: PointerEvent<HTMLDivElement>): void => {
    if (drag.current?.id === event.pointerId) drag.current = null;
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const element = viewport.current;

    if (!element) return;

    const offset = element[axis.offset];
    const page = element[axis.viewport];

    const targets: Partial<Record<string, number>> = {
      [axis.backward]: offset - LINE_STEP,
      [axis.forward]: offset + LINE_STEP,
      PageUp: offset - page,
      PageDown: offset + page,
      Home: 0,
      End: element[axis.extent] - page,
    };

    const target = targets[event.key];

    if (target === undefined) return;

    event.preventDefault();
    scrollTo(target);
  };

  return {
    attach,
    attachTrack,
    content,
    thumb,
    measure,
    metrics,
    onKeyDown,
    startPointer,
    movePointer,
    endPointer,
  };
};
