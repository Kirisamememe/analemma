import { Outlet, useMatchRoute, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { SaveStatusProvider } from "@/features/fixed-pages/editor/save-status-provider";
import { AppNavigation } from "@/features/navigation/app-navigation";
import { AppShell } from "@/ui/layout";

/** ログインした後の画面をナビと一緒に置く骨組み。 */
export const SignedInLayout = (): ReactNode => {
  const matchRoute = useMatchRoute();

  const pathname = useRouterState({
    select: (state) => state.matches.at(-1)?.pathname, // 移り終えた画面のパス(URL は、移り始めたときに替わる)
  });

  const editorLocation = useRouterState({
    select: ({ resolvedLocation }) =>
      resolvedLocation?.pathname.startsWith("/fixed-pages/") === true
        ? resolvedLocation.href
        : undefined,
  });

  return (
    <SaveStatusProvider location={editorLocation}>
      <AppShell
        nav={
          <AppNavigation
            isCurrent={(href) =>
              matchRoute({ to: href, fuzzy: href !== "/" }) !== false
            }
          />
        }
        pageKey={pathname}
      >
        <Outlet />
      </AppShell>
    </SaveStatusProvider>
  );
};
