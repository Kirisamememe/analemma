import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { LocaleContext } from "./i18n/locale-context";
import type { Locale } from "./i18n/locales";
import type { AppRouter } from "./router";

/** 管理画面の全体に渡す値。 */
type AppProps = {
  /** 画面に出す言語。 */
  readonly locale: Locale;
  /** 管理画面の router。 */
  readonly router: AppRouter;
  /** server の状態を持つ query client。 */
  readonly queryClient: QueryClient;
};

/** 言語・server の状態・route をつないだ、管理画面の全体。 */
export const App = ({ locale, router, queryClient }: AppProps): ReactNode => (
  <LocaleContext value={locale}>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </LocaleContext>
);
