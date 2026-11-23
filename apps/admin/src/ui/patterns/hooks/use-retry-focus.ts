import { useRef } from "react";

/** 取り直しを始めたボタンから、読み込んだ欄へ focus を移す。 */
export const useRetryFocus = () => {
  const trigger = useRef<HTMLButtonElement | null>(null);

  return {
    remember: (button: HTMLButtonElement): void => {
      trigger.current = document.activeElement === button ? button : null;
    },
    focus: (region: HTMLElement | null): void => {
      const button = trigger.current;

      if (region === null || button === null) return;

      trigger.current = null;

      if (
        document.activeElement === document.body ||
        document.activeElement === button
      ) {
        region.focus();
      }
    },
  };
};
