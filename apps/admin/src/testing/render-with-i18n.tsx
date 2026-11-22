import { type RenderResult, render } from "@testing-library/react";
import type { i18n as I18n } from "i18next";
import type { ReactElement, ReactNode } from "react";
import { I18nextProvider } from "react-i18next";

import { createI18n } from "@/i18n/create-i18n";
import type { Locale } from "@/i18n/locales";

/** `wrapper` に渡す値。 */
type WrapperProps = {
  /** 描く部品。 */
  readonly children: ReactNode;
};

/** テストで使う i18next の instance を渡す。 */
export const withI18n = (i18n: I18n) => {
  const Wrapper = ({ children }: WrapperProps): ReactNode => (
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  );

  return Wrapper;
};

/** 部品を、決めた言語の i18next の instance の下で描く。 */
export const renderWithI18n = (
  ui: ReactElement,
  locale: Locale = "en",
): RenderResult => render(ui, { wrapper: withI18n(createI18n(locale)) });
