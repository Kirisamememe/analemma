import { type RenderResult, render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { I18nextProvider } from "react-i18next";

import { createI18n } from "../i18n/create-i18n";
import type { Locale } from "../i18n/locales";

/** `wrapper` に渡す値。 */
type WrapperProps = {
  /** 描く部品。 */
  readonly children: ReactNode;
};

/** 部品を、決めた言語の i18next の instance の下で描く。 */
export const renderWithI18n = (
  ui: ReactElement,
  locale: Locale = "en",
): RenderResult => {
  const i18n = createI18n(locale);

  return render(ui, {
    wrapper: ({ children }: WrapperProps) => (
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    ),
  });
};
