import { Outlet } from "@tanstack/react-router";
import { type ReactNode, use } from "react";

import { LocaleContext } from "../i18n/locale-context";
import { AppShell } from "../ui/layout/app-shell";
import { UiProvider } from "../ui/primitives/ui-provider";

/** すべての画面を包む骨組み。 */
export const RootLayout = (): ReactNode => (
  <UiProvider locale={use(LocaleContext)}>
    <AppShell>
      <Outlet />
    </AppShell>
  </UiProvider>
);
