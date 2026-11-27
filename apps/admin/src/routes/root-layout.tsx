import { Outlet, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { useIsLoadingFirstData } from "@/api/server-state/pending-state";
import { NavigationProgress } from "@/ui/primitives/navigation";
import { UiProvider } from "@/ui/primitives/ui-provider";

const RouteProgress = (): ReactNode => {
  const isRouting = useRouterState({ select: (state) => state.isLoading });
  const isLoadingData = useIsLoadingFirstData();

  return <NavigationProgress isActive={isRouting || isLoadingData} />;
};

/** すべての画面に UI の Provider を渡し、読み込みの間は上端に帯を流す。 */
export const RootLayout = (): ReactNode => (
  <UiProvider>
    <RouteProgress />
    <Outlet />
  </UiProvider>
);
