import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { RouterContextProvider } from "@tanstack/react-router";
import type { ReactNode } from "react";

import type { AppParts, AppRouter } from "@/app";
import { createI18n } from "@/i18n/create-i18n";
import { withI18n } from "@/testing/render-with-i18n";
import { ToastProvider } from "@/ui/primitives/overlays";

type WrapperProps = {
  /** 描く部品。 */
  children: ReactNode;
};

/** hook のテストに query client を渡す。 */
export const withQueryClient = (client: QueryClient) => {
  const Wrapper = ({ children }: WrapperProps): ReactNode => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

  return Wrapper;
};

/** hook のテストに router を渡す。 */
export const withRouter = (router: AppRouter) => {
  const Wrapper = ({ children }: WrapperProps): ReactNode => (
    <RouterContextProvider router={router}>{children}</RouterContextProvider>
  );

  return Wrapper;
};

/** 管理画面の hook のテストに日本語の訳、query client、router、Toast を渡す。 */
export const withAppProviders = ({ queryClient, router }: AppParts) => {
  const I18n = withI18n(createI18n("ja"));

  const Wrapper = ({ children }: WrapperProps): ReactNode => (
    <I18n>
      <QueryClientProvider client={queryClient}>
        <RouterContextProvider router={router}>
          <ToastProvider closeLabel="閉じる">{children}</ToastProvider>
        </RouterContextProvider>
      </QueryClientProvider>
    </I18n>
  );

  return Wrapper;
};
