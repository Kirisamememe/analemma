import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { RouterContextProvider } from "@tanstack/react-router";
import type { i18n as I18n } from "i18next";
import type { ReactNode } from "react";
import { I18nextProvider } from "react-i18next";

import type { AppRouter } from "../router";

type WrapperProps = {
  /** 描く部品。 */
  readonly children: ReactNode;
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

/** hook のテストに i18next の instance を渡す。 */
export const withI18n = (i18n: I18n) => {
  const Wrapper = ({ children }: WrapperProps): ReactNode => (
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  );

  return Wrapper;
};
