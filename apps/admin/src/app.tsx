import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import type { i18n as I18n } from "i18next";
import type { ReactNode } from "react";
import { I18nextProvider } from "react-i18next";

import type { AppRouter } from "@/router";

/** 管理画面の全体に渡す値。 */
type AppProps = {
  /** 画面の言語と訳を持つ i18next の instance。 */
  readonly i18n: I18n;
  /** 管理画面の router。 */
  readonly router: AppRouter;
  /** server の状態を持つ query client。 */
  readonly queryClient: QueryClient;
};

/** 言語・server の状態・route をつないだ、管理画面の全体。 */
export const App = ({ i18n, router, queryClient }: AppProps): ReactNode => (
  <I18nextProvider i18n={i18n}>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </I18nextProvider>
);
