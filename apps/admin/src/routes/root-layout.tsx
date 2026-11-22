import { Outlet } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { AppShell } from "../ui/layout/app-shell";
import { UiProvider } from "../ui/primitives/ui-provider";

/** すべての画面を包む骨組み。 */
export const RootLayout = (): ReactNode => (
  <UiProvider>
    <AppShell>
      <Outlet />
    </AppShell>
  </UiProvider>
);
