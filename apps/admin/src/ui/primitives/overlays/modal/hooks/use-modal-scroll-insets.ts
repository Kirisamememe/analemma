import { useCallback } from "react";

const observe = (
  bar: HTMLElement | null,
  property: "--modal-header-height" | "--modal-footer-height",
) => {
  const dialog = bar?.parentElement;

  if (!bar || !dialog) return;

  const measure = (): void => {
    dialog.style.setProperty(property, `${String(bar.offsetHeight)}px`);
  };

  measure();
  const observer = new ResizeObserver(measure);
  observer.observe(bar, { box: "border-box" });

  return () => {
    observer.disconnect();
    dialog.style.removeProperty(property);
  };
};

/** 固定した見出しとフッターの実寸にスクロール先の余白を合わせる。 */
export const useModalScrollInsets = () => {
  const attachHeader = useCallback(
    (bar: HTMLElement | null) => observe(bar, "--modal-header-height"),
    [],
  );

  const attachFooter = useCallback(
    (bar: HTMLElement | null) => observe(bar, "--modal-footer-height"),
    [],
  );

  return { attachHeader, attachFooter };
};
