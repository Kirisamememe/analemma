import { Outlet, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { AppNavigation } from "./app-navigation";

import { SaveStatusProvider } from "@/features/fixed-pages/editor/save-status-provider";
import { AppShell } from "@/ui/layout";

/** ログインした後の画面をナビと一緒に置く骨組み。 */
export const SignedInLayout = (): ReactNode => {
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
      <AppShell nav={<AppNavigation />} pageKey={pathname}>
        <Outlet />
      </AppShell>
    </SaveStatusProvider>
  );
};
