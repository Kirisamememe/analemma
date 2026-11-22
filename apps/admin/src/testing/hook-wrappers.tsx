import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { RouterContextProvider } from "@tanstack/react-router";
import type { ReactNode } from "react";

import type { AppRouter } from "@/router";

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
