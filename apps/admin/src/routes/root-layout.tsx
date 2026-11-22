import { Outlet } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { UiProvider } from "@/ui/primitives/ui-provider";

/** すべての画面に UI の Provider を渡す。 */
export const RootLayout = (): ReactNode => (
  <UiProvider>
    <Outlet />
  </UiProvider>
);
