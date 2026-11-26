import { within } from "@testing-library/react";

const CJK_LANGUAGE = /^(?:ja|ko|zh)(?:-|$)/iv;
const FULL_STOP = /[.。．｡]$/v;

/** CJK のガイドが句点で終わっているか。 */
export const endsWithGuidePeriod = (lang: string, guide: string): boolean =>
  CJK_LANGUAGE.test(lang) && FULL_STOP.test(guide.trimEnd());

/** 表示中のフォームで、CJK の文字数や書式の案内に残った句点を探す。 */
export const findFieldGuidesWithPeriods = (
  root: HTMLElement,
  lang: string,
): string[] => {
  if (!CJK_LANGUAGE.test(lang)) return [];

  const ids = new Set<string>();
  const scope = within(root);

  for (const role of [
    "textbox",
    "spinbutton",
    "checkbox",
    "combobox",
    "group",
    "button",
  ]) {
    for (const control of scope.queryAllByRole(role, { hidden: true })) {
      const description = control.getAttribute("aria-describedby");

      if (description) {
        for (const id of description.split(/\s+/v)) ids.add(id);
      }
    }
  }

  return [...ids].flatMap((id) => {
    const guide = root.ownerDocument.querySelector<HTMLElement>(
      `#${CSS.escape(id)}`,
    );

    return guide?.slot === "description" &&
      endsWithGuidePeriod(guide.lang || lang, guide.textContent)
      ? [guide.textContent]
      : [];
  });
};
