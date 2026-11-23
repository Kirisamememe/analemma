const FOCUSABLE = "input:not([type=hidden]),textarea,button,[role=spinbutton]";

const isFocusTarget = (element: Element): element is HTMLElement =>
  element instanceof HTMLElement &&
  element.matches(FOCUSABLE) &&
  element.tabIndex >= 0 &&
  element.closest("[aria-hidden=true]") === null;

/** 範囲の中の最初の誤りの欄を見せて、focus を移す。 */
export const focusFirstInvalidField = (container: Element | null): void => {
  requestAnimationFrame(() => {
    const field = container?.querySelector("[data-invalid]"); // React Aria Components が誤りの欄の外枠に付ける

    const target =
      field instanceof HTMLElement && field.hasAttribute("tabindex")
        ? field
        : [...(field?.querySelectorAll(FOCUSABLE) ?? [])].find((element) =>
            isFocusTarget(element),
          );

    const heading =
      field instanceof HTMLFieldSetElement && field === target
        ? field.ariaLabelledByElements?.[0]
        : undefined;

    (heading ?? field)?.scrollIntoView({
      block: heading === undefined ? "nearest" : "center",
    });
    target?.focus({ preventScroll: true });
  });
};
