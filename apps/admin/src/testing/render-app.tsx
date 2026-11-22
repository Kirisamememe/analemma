import type { RouterHistory } from "@tanstack/react-router";
import { render } from "@testing-library/react";
import type { i18n as I18n } from "i18next";

import { App } from "@/app";
import { createI18n } from "@/i18n/create-i18n";
import type { Locale } from "@/i18n/locales";
import { type TestAppOptions, createTestApp } from "@/testing/create-test-app";

/** 描く管理画面の条件。 */
export type RenderAppOptions = TestAppOptions & {
  /** 画面の言語。 */
  readonly locale?: Locale;
};

/** 描いた管理画面と、確かめるためのもの。 */
export type RenderedApp = {
  /** 画面の履歴。 */
  readonly history: RouterHistory;
  /** 呼ばれた procedure のパスの並び。 */
  readonly calls: readonly string[];
  /** 画面の言語と訳を持つ i18next の instance。 */
  readonly i18n: I18n;
};

/** 作り物の server と認証器につないだ管理画面を、全体で描く。 */
export const renderApp = ({
  locale = "ja",
  ...options
}: RenderAppOptions): RenderedApp => {
  const { history, calls, router, queryClient } = createTestApp(options);
  const i18n = createI18n(locale);

  render(<App i18n={i18n} queryClient={queryClient} router={router} />);

  return { history, calls, i18n };
};
