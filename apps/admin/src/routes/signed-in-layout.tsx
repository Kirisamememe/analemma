import { Outlet, useMatchRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { AppNavigation } from "@/features/navigation/app-navigation";
import { AppShell } from "@/ui/layout";

/** ログインした後の画面をナビと一緒に置く骨組み。 */
export const SignedInLayout = (): ReactNode => {
  const matchRoute = useMatchRoute();

  return (
    <AppShell
      nav={
        <AppNavigation
          isCurrent={(href) =>
            matchRoute({ to: href, fuzzy: href !== "/" }) !== false
          }
        />
      }
    >
      <Outlet />
    </AppShell>
  );
};
